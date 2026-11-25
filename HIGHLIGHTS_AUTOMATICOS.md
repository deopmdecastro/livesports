# Destaques automáticos

O servidor procura vídeos de melhores momentos na API oficial YouTube Data v3 para eventos terminados recentes com as duas equipas identificadas. Está desativado enquanto não existirem uma chave e pelo menos um canal aprovado. Não altera vídeos guardados manualmente. Quando a equipa remove um vídeo, a pesquisa desse evento fica pausada; pode ser reativada na gestão do evento.

## Configuração

1. Ative a YouTube Data API v3 num projeto Google Cloud e crie uma chave com restrição à API e às origens/IPs de servidor adequados. Proteja-a num gestor de segredos ou ambiente privado do servidor — não a coloque em ficheiros versionados.
2. Escolha até três IDs de canais YouTube (`UC` seguido de 22 caracteres) cujos conteúdos e direitos de incorporação tenham sido verificados para este serviço e território. Um vídeo público/incorporável não comprova que se possui licença ou direitos necessários.
3. Defina no ambiente do backend (ou forneça ao Docker Compose por mecanismo de segredos seguro):

   - `YOUTUBE_DATA_API_KEY`: chave privada da API.
   - `YOUTUBE_HIGHLIGHTS_CHANNEL_IDS`: IDs de canais separados por vírgulas.
   - `YOUTUBE_SEARCH_DAILY_LIMIT`: limite local de chamadas de pesquisa por dia, padrão 20, máximo 100. Ajuste à quota efetiva do projeto Google.

4. Aplique as migrações e reinicie o backend. A gestão de vídeo mostra se o serviço está configurado. Verifique a utilização/quota e possíveis erros no Google Cloud e nos logs do backend. Não exponha a chave no cliente ou no repositório.

A pesquisa é conservadora: exige nomes de ambas as equipas e termos de destaques, canal aprovado, janela temporal, duração adequada e vídeo público incorporável; rejeita conteúdos claramente incompatíveis. Associa apenas um candidato válido. Jogos repetidos, nomes iguais, títulos ambíguos, alterações de vídeo e permissões territoriais podem ainda causar erros ou impedir uma associação; a equipa deve verificar regularmente os vídeos e remover os incorretos. Não há garantia de que exista um vídeo apropriado nem que uma correspondência seja perfeita. Jogos sem correspondência inequívoca permanecem sem vídeo. Pesquisa até cinco eventos por ciclo, a cada 15 minutos, e volta a tentar um evento após 12 horas, dentro da janela de sete dias.

Teste local sem rede/chave: `npm --prefix backend run build && (cd backend && node --test tests/auto-highlights.test.cjs)`.
