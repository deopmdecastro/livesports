# TODO - Reset total front/back (Docker)

## Checklist
- [ ] Parar e remover containers + volumes (reset total)
- [ ] Subir novamente com rebuild completo
- [ ] Garantir migrações/seed do backend se necessário
- [ ] Verificar health do backend: http://localhost:3001/health
- [ ] Verificar front e proxy do nginx (http://localhost/)
- [x] Anotar comandos usados (para repetir depois)

## Comandos executados
- docker-compose down -v --remove-orphans
- docker-compose up -d --build --force-recreate
- docker-compose logs --no-color --tail=50
- powershell -NoProfile -Command "Invoke-RestMethod -Uri http://localhost:3001/health -TimeoutSec 10"

