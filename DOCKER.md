# GitHub Dashboard Docker Setup

## Prerequisites
- Docker and Docker Compose installed
- GitHub Personal Access Token

## Setup

1. Create a `.env` file in the root directory:
```env
GITHUB_TOKEN=your_github_token_here
```

2. Build and run the containers:
```bash
docker-compose up --build
```

3. Access the application:
- Client: http://localhost:3000
- API: http://localhost:5010

## Development

To rebuild after code changes:
```bash
docker-compose up --build
```

To stop the containers:
```bash
docker-compose down
```

## Production Deployment

For production, update the `docker-compose.yml` file with:
- Proper domain names in CORS configuration
- Secure environment variable management
- SSL/TLS certificates
- Proper nginx configuration
