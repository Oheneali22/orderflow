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
    }
}
