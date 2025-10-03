pipeline {
    agent {
        docker {
            image 'node:16-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    environment {
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
        SNYK_TOKEN = credentials('snyk-api-token')
        DOCKER_IMAGE = "luciangogogo/nodejs-app"
        BUILD_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code from GitHub...'
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo 'Installing Docker CLI and dependencies...'
                sh '''
                    apk update
                    apk add --no-cache docker
                    docker --version
                    node --version
                    npm --version
                '''
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
                sh 'npm test'
            }
        }
        
        stage('Security Scan - Snyk Vulnerability Check') {
            steps {
                echo '=== Running Snyk Security Scan ==='
                script {
                    // 安装 Snyk CLI
                    sh '''
                        echo "Installing Snyk CLI..."
                        npm install -g snyk
                        snyk --version
                    '''
                    
                    // 认证 Snyk
                    sh '''
                        echo "Authenticating with Snyk..."
                        snyk auth $SNYK_TOKEN
                    '''
                    
                    try {
                        // 运行 Snyk 测试
                        sh '''
                            echo "Running Snyk vulnerability scan..."
                            snyk test --severity-threshold=high --json > snyk-report.json
                            
                            echo "=========================================="
                            echo "✅ No HIGH or CRITICAL vulnerabilities found"
                            echo "=========================================="
                        '''
                    } catch (Exception e) {
                        echo "=========================================="
                        echo "❌ HIGH or CRITICAL vulnerabilities found!"
                        echo "=========================================="
                        sh 'snyk test --severity-threshold=high'
                        currentBuild.result = 'FAILURE'
                        error('Security scan failed: High or Critical vulnerabilities detected')
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image...'
                script {
                    sh """
                        docker build -t ${env.DOCKER_IMAGE}:${env.BUILD_TAG} .
                        docker tag ${env.DOCKER_IMAGE}:${env.BUILD_TAG} ${env.DOCKER_IMAGE}:latest
                    """
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                echo 'Pushing Docker image to registry...'
                script {
                    sh """
                        echo ${env.DOCKER_CREDENTIALS_PSW} | docker login -u ${env.DOCKER_CREDENTIALS_USR} --password-stdin
                        docker push ${env.DOCKER_IMAGE}:${env.BUILD_TAG}
                        docker push ${env.DOCKER_IMAGE}:latest
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo 'Archiving security scan reports...'
            archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
        }
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check the logs for details.'
        }
    }
}
