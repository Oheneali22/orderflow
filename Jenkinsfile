pipeline {
    agent { label 'orderflow' }

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
    }
}
