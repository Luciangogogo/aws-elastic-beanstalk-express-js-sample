pipeline {
    agent any  // default agent：Jenkins container.

    environment {
        // Docker image configuration
        DOCKER_IMAGE = "luciangogogo/nodejs-app"
        BUILD_TAG = "${env.BUILD_NUMBER}"
        DOCKER_IMAGE_FULL = "${DOCKER_IMAGE}:${BUILD_TAG}"
        DOCKER_IMAGE_LATEST = "${DOCKER_IMAGE}:latest"
        
        // credentials (loaded normally, reserved for future push)
        DOCKER_CREDENTIALS = credentials('docker-hub-credentials')
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                git branch: 'main', url: 'https://github.com/Luciangogogo/aws-elastic-beanstalk-express-js-sample.git'
                // Stash the entire workspace to Jenkins storage, for subsequent stages to restore.
                stash includes: '**/*', name: 'source-code'
                echo 'Code checked out and stashed successfully.'
            }
        }

        stage('Install Dependencies') {
            agent {
                docker {
                    image 'node:18'
                    args '-u root'  // root permission.
                }
            }
            steps {
                // restore stashed workspace to the current dir in the container.
                unstash 'source-code'
                sh 'ls -la'  // debug: confirm package.json exists.
                sh 'npm install --save'  // now can find package.json.
            }
        }

        stage('Security Scan') {
            agent {
                docker {
                    image 'node:18'
                    args '-u root'
                    reuseNode true  // reuse container, inherit node_modules.
                }
            }
            steps {
        unstash 'source-code'
        withCredentials([string(credentialsId: 'snyk-credentials', variable: 'SNYK_TOKEN')]) {
            sh '''
                # install Snyk CLI globally
                npm install -g snyk
                
                # install jq for precise JSON query (avoid grep false positive)
                apt-get update && apt-get install -y jq
                
                # auth
                snyk auth $SNYK_TOKEN
                
                # scan: threshold=high (CLI built-in fail if vulns), JSON output
                snyk test --severity-threshold=high --json > snyk-report.json
                
                # precise check: only query high/critical in vulnerabilities array (ignore licenses)
                if jq -e '.vulnerabilities[] | select(.severity == "high" or .severity == "critical")' snyk-report.json > /dev/null; then
                    echo "High/Critical vulnerabilities detected in dependencies - failing build."
                    exit 1
                else
                    echo "No High/Critical vulnerabilities found. Scan passed."
                    echo "Summary: $(jq -r '.summary' snyk-report.json)"
                fi
            '''
        }
        archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
    }
            
        }
        
        stage('Run Unit Tests') {
            agent {
                docker {
                    image 'node:18'
                    args '-u root'
                    reuseNode true  // reuse container, inherit node_modules.
                }
            }
            steps {
                // restore workspace（includes installed node_modules）。
                unstash 'source-code'
                sh 'ls -la test/'  // debug: confirm test files.
                sh 'npm test'  // run tests.
            }
        }

        stage('Check Docker Connection') {
            agent any
            steps {
                sh 'docker info'  // test DinD connection.
            }
        }

        stage('Build Docker Image') {
            agent any
            steps {
                sh 'docker build -t ${DOCKER_IMAGE_FULL} .'
            }
        }

        stage('Push Docker Image') {
            agent any
            steps {
                sh '''
                docker login -u ${DOCKER_CREDENTIALS_USR} -p ${DOCKER_CREDENTIALS_PSW}
                docker tag ${DOCKER_IMAGE_FULL} ${DOCKER_IMAGE_LATEST}
                docker push ${DOCKER_IMAGE_LATEST}
                '''
            }
        }
    }

    post {
        always {
            cleanWs()  // clean.
        }
        success {
            echo 'Pipeline successfully completed!'
        }
        failure {
            echo 'Pipeline failed - check logs.'
        }
    }
}