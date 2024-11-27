
# Variables
DOCKER_COMPOSE=docker-compose
DOCKER_EXEC=docker exec -it checkout-app

# Commands
start:
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml --env-file .env.local up -d --build

stop:
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml --env-file .env.local down 

stop-and-remove-volumes:
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml --env-file .env.local down --volumes --remove-orphans

# Migrations
migration:
	$(DOCKER_EXEC) npm run typeorm -- -d ./src/config/typeorm.config.ts migration:run

migration-test:
	$(DOCKER_EXEC) bash -c "NODE_ENV=test npm run typeorm -- -d ./src/config/typeorm.config.ts migration:run"

revert-last-migration:
	$(DOCKER_EXEC) npm run typeorm -- -d ./src/config/typeorm.config.ts migration:revert

revert-last-migration-test:
	$(DOCKER_EXEC) bash -c "NODE_ENV=test npm run typeorm -- -d ./src/config/typeorm.config.ts migration:revert"

generate-migrations:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name is required."; \
		exit 1; \
	fi
	$(DOCKER_EXEC) npm run typeorm -- -d ./src/config/typeorm.config.ts migration:generate ./src/database/migrations/$(name)

# Testing
run-tests:
	$(DOCKER_EXEC) npm run test

run-e2e-tests:
	$(DOCKER_EXEC) bash -c "NODE_ENV=test npm run test:e2e"