# PineLoad v0.1.0-Alpha
Essa extensão não baixa nenhum vídeo ainda, apenas aparece o popout no canto inferior nas extensões do Chrome.

# PineLoad 0.3.0
Extensão de navegador que baixa vídeos com qualidade selecionável. Usa também um servidor backend feito com Python com yt-dlp.

## Como usar (3 passos)

### 1. **Instale a extensão**
1. Baixe este repositório
2. Abra o Chrome → `chrome://extensions`
3. Ative **"Modo do desenvolvedor"**
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta `PineLoad v0.1.0-alpha`

### 2. **Rode o servidor Python**
```bash
pip install flask yt-dlp
python server.py