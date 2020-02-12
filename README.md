Docker-OpenVidu-LoadTesting


Install docker-ce and docker-compose

then run

SESSION_NAME=<unique_name_for_session> docker compose up --scale chrome-instances=<number_of_sessions>