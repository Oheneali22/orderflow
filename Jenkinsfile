pipeline {
    agent { label 'orderflow' }

    environment {
        TEST_DATABASE_CONTAINER = 'orderflow-jenkins-test-postgres'
        TEST_DATABASE_URL = 'postgresql://orderflow:test-only@orderflow-jenkins-test-postgres:5432/orderflow_test'
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = '942909611186.dkr.ecr.us-east-1.amazonaws.com'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh '''
                    npm run lint
                    node --test --test-concurrency=1 test/api.test.js test/processor.test.js

                    docker rm --force "$TEST_DATABASE_CONTAINER" 2>/dev/null || true
                    docker run --detach \
                        --name "$TEST_DATABASE_CONTAINER" \
                        --network orderflow-jenkins-net \
                        --env POSTGRES_DB=orderflow_test \
                        --env POSTGRES_USER=orderflow \
                        --env POSTGRES_PASSWORD=test-only \
                        --health-cmd="pg_isready -U orderflow -d orderflow_test" \
                        --health-interval=2s \
                        --health-timeout=3s \
                        --health-retries=15 \
                        postgres:16-alpine

                    for attempt in $(seq 1 30); do
                        status=$(docker inspect --format '{{.State.Health.Status}}' "$TEST_DATABASE_CONTAINER")
                        [ "$status" = "healthy" ] && break
                        [ "$status" = "unhealthy" ] && docker logs "$TEST_DATABASE_CONTAINER" && exit 1
                        sleep 1
                    done

                    [ "$(docker inspect --format '{{.State.Health.Status}}' "$TEST_DATABASE_CONTAINER")" = "healthy" ]
                    node --test --test-concurrency=1 test/database.integration.test.js
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    IMAGE_TAG="sha-$(git rev-parse HEAD)"
                    docker build --pull -f web/Dockerfile -t "orderflow-web:$IMAGE_TAG" web
                    docker build --pull -f Dockerfile.api -t "orderflow-api:$IMAGE_TAG" .
                    docker build --pull -f Dockerfile.worker -t "orderflow-worker:$IMAGE_TAG" .
                '''
            }
        }

        stage('Scan') {
            steps {
                sh '''
                    IMAGE_TAG="sha-$(git rev-parse HEAD)"
                    for component in web api worker; do
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v orderflow-trivy-cache:/root/.cache/trivy \
                            aquasec/trivy:0.73.0 image \
                            --scanners vuln \
                            --severity HIGH,CRITICAL \
                            --ignore-unfixed \
                            --exit-code 1 \
                            "orderflow-$component:$IMAGE_TAG"
                    done
                '''
            }
        }

        stage('Publish') {
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
                            -e AWS_ACCESS_KEY_ID \
                            -e AWS_SECRET_ACCESS_KEY \
                            -e AWS_DEFAULT_REGION="$AWS_REGION" \
                            amazon/aws-cli:2.36.32 \
                            ecr get-login-password --region "$AWS_REGION" | \
                            docker login --username AWS --password-stdin "$ECR_REGISTRY"

                        for component in web api worker; do
                            docker tag \
                                "orderflow-$component:$IMAGE_TAG" \
                                "$ECR_REGISTRY/orderflow-$component:$IMAGE_TAG"
                            docker push "$ECR_REGISTRY/orderflow-$component:$IMAGE_TAG"
                        done
                    '''
                }
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
