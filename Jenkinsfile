pipeline {
    agent { label 'orderflow' }

    environment {
        TEST_DATABASE_CONTAINER = 'orderflow-jenkins-test-postgres'
        TEST_DATABASE_URL = 'postgresql://orderflow:test-only@orderflow-jenkins-test-postgres:5432/orderflow_test'
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
                        --file web/Dockerfile \
                        --tag "orderflow-web:$IMAGE_TAG" \
                        web

                    docker build \
                        --file Dockerfile.api \
                        --tag "orderflow-api:$IMAGE_TAG" \
                        .

                    docker build \
                        --file Dockerfile.worker \
                        --tag "orderflow-worker:$IMAGE_TAG" \
                        .
                '''
            }
        }
    }

    post {
        always {
            sh 'docker rm --force "$TEST_DATABASE_CONTAINER" 2>/dev/null || true'
        }
    }
}
