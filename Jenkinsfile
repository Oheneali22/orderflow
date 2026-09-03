pipeline {
    agent { label 'orderflow' }

    environment {
        TEST_DATABASE_CONTAINER = 'orderflow-jenkins-test-postgres'
        TEST_DATABASE_URL = 'postgresql://orderflow:test-only@orderflow-jenkins-test-postgres:5432/orderflow_test'
        AWS_ACCOUNT_ID = '942909611186'
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '942909611186.dkr.ecr.us-east-1.amazonaws.com'
    }

    stages {
        stage('Verify agent') {
            steps {
                sh '''
                    whoami
                    node --version
                    npm --version
                    git --version
                    docker --version
                '''
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
        stage('Unit tests') {
            steps {
                sh 'node --test --test-concurrency=1 test/api.test.js test/processor.test.js'
            }
        }

        stage('Start test database') {
            steps {
                sh '''
                    docker rm --force "$TEST_DATABASE_CONTAINER" 2>/dev/null || true
                    docker run --detach \
                        --name "$TEST_DATABASE_CONTAINER" \
                        --network orderflow-jenkins-net \
                        --env POSTGRES_DB=orderflow_test \
                        --env POSTGRES_USER=orderflow \
                        --env POSTGRES_PASSWORD=test-only \
                        --health-cmd="pg_isready -U orderflow -d orderflow_test" \
                        --health-interval=5s \
                        --health-timeout=3s \
                        --health-retries=10 \
                        postgres:16-alpine
                '''
            }
        }

        stage('Wait for test database') {
            steps {
                sh '''
                    for attempt in $(seq 1 30); do
                        status=$(docker inspect --format '{{.State.Health.Status}}' "$TEST_DATABASE_CONTAINER")

                        if [ "$status" = "healthy" ]; then
                            exit 0
                        fi

                        if [ "$status" = "unhealthy" ]; then
                            docker logs "$TEST_DATABASE_CONTAINER"
                            exit 1
                        fi

                        sleep 2
                    done

                    docker logs "$TEST_DATABASE_CONTAINER"
                    echo "PostgreSQL did not become healthy within 60 seconds"
                    exit 1
                '''
            }
        }

        stage('PostgreSQL integration tests') {
            steps {
                sh 'node --test --test-concurrency=1 test/database.integration.test.js'
            }
        }

        stage('Build images') {
            steps {
                sh '''
                    IMAGE_TAG="sha-$(git rev-parse HEAD)"

                    docker build \
                        --pull \
                        --no-cache \
                        --file web/Dockerfile \
                        --tag "orderflow-web:$IMAGE_TAG" \
                        web

                    docker build \
                        --pull \
                        --no-cache \
                        --file Dockerfile.api \
                        --tag "orderflow-api:$IMAGE_TAG" \
                        .

                    docker build \
                        --pull \
                        --no-cache \
                        --file Dockerfile.worker \
                        --tag "orderflow-worker:$IMAGE_TAG" \
                        .
                '''
            }
        }

        stage('Scan images') {
            steps {
                sh '''
                    IMAGE_TAG="sha-$(git rev-parse HEAD)"
                    scan_failed=0

                    for component in web api worker; do
                        image="orderflow-$component:$IMAGE_TAG"

                        docker run --rm \
                            --volume /var/run/docker.sock:/var/run/docker.sock \
                            --volume orderflow-trivy-cache:/root/.cache/trivy \
                            aquasec/trivy:0.73.0 image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --ignore-unfixed \
                            --exit-code 1 \
                            "$image" || scan_failed=1
                    done

                    exit "$scan_failed"
                '''
            }
        }

        stage('Publish images to ECR') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'd5d0d59e-1796-45b6-9699-9ba5dff8d9c2',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                        set +x
                        IMAGE_TAG="sha-$(git rev-parse HEAD)"

                        docker run --rm \
                            --env AWS_ACCESS_KEY_ID \
                            --env AWS_SECRET_ACCESS_KEY \
                            --env AWS_DEFAULT_REGION="$AWS_REGION" \
                            amazon/aws-cli:2.36.32 \
                            ecr get-login-password --region "$AWS_REGION" | \
                            docker login \
                                --username AWS \
                                --password-stdin \
                                "$ECR_REGISTRY"

                        for component in web api worker; do
                            local_image="orderflow-$component:$IMAGE_TAG"
                            remote_image="$ECR_REGISTRY/orderflow-$component:$IMAGE_TAG"

                            docker tag "$local_image" "$remote_image"
                            docker push "$remote_image"
                        done

                        unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
                    '''
                }
            }
        }

        stage('Clean published images') {
            steps {
                sh '''
                    IMAGE_TAG="sha-$(git rev-parse HEAD)"

                    for component in web api worker; do
                        docker image rm \
                            "$ECR_REGISTRY/orderflow-$component:$IMAGE_TAG" \
                            "orderflow-$component:$IMAGE_TAG" || true
                    done

                    docker logout "$ECR_REGISTRY" || true
                '''
            }
        }
    }

    post {
        always {
            sh '''
                docker rm --force "$TEST_DATABASE_CONTAINER" 2>/dev/null || true
                docker logout "$ECR_REGISTRY" 2>/dev/null || true
            '''
        }
    }
}
