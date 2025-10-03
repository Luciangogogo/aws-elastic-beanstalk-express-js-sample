pipeline {
    agent {
        docker {
            image 'node:16-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    environment {
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
        // Snyk API Token(need to be configured in Jenkins)
        SNYK_TOKEN = credentials('snyk-api-token')
        DOCKER_IMAGE = "luciangogogo/nodejs-app"
        BUILD_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                sh 'node --version'
                sh 'npm --version'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm install --save'
            }
        }
        
        stage('Run Unit Tests') {
            steps {
                echo 'Running unit tests...'
                sh 'npm test || true'
            }
        }
        
        stage('Security Scan - Snyk Vulnerability Check') {
            steps {
                echo '=== Running Snyk Security Scan ==='
                script {
                    // install Snyk CLI
                    sh '''
                        echo "Installing Snyk CLI..."
                        npm install -g snyk
                        snyk --version
                    '''
                    
                    // authenticate Snyk
                    sh '''
                        echo "Authenticating with Snyk..."
                        snyk auth $SNYK_TOKEN
                    '''
                    
                    // run Snyk test, only check high and critical vulnerabilities
                    def snykResult = sh(
                        script: '''
                            echo "Running Snyk vulnerability scan..."
                            snyk test --severity-threshold=high --json > snyk-report.json || true
                            cat snyk-report.json
                        ''',
                        returnStatus: true
                    )
                    
                    // analyze scan results
                    sh '''
                        echo "Analyzing scan results..."
                        if grep -q '"severity":"high"' snyk-report.json || grep -q '"severity":"critical"' snyk-report.json; then
                            echo "=========================================="
                            echo "❌ HIGH or CRITICAL vulnerabilities found!"
                            echo "=========================================="
                            snyk test --severity-threshold=high
                            exit 1
                        else
                            echo "=========================================="
                            echo "✅ No HIGH or CRITICAL vulnerabilities found"
                            echo "=========================================="
                        fi
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    sh """
                        docker build -t ${DOCKER_IMAGE}:${BUILD_TAG} .
                        docker tag ${DOCKER_IMAGE}:${BUILD_TAG} ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo 'Pushing Docker image to registry...'
                script {
                    sh """
                        echo \$DOCKER_CREDENTIALS_PSW | docker login -u \$DOCKER_CREDENTIALS_USR --password-stdin
                        docker push ${DOCKER_IMAGE}:${BUILD_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo 'Archiving security scan reports...'
            // archive Snyk report
            archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs for details.'
        }
    }
}
