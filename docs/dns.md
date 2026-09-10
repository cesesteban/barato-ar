# DNS setup — barato.ar

Requisitos del dominio productivo para que Resend envíe emails desde `@barato.ar` sin caer en spam (C-012).

## Records en el registrar

```
TXT   @                          v=spf1 include:_spf.resend.com ~all
TXT   resend._domainkey          <valor exacto del Resend dashboard>
TXT   _dmarc                     v=DMARC1; p=quarantine; rua=mailto:dmarc@barato.ar; ruf=mailto:dmarc@barato.ar; fo=1
```

Opcional pero recomendado:

```
MX    @  10  feedback-smtp.us-east-1.amazonses.com
CNAME img  <cuenta>.r2.cloudflarestorage.com     ; custom domain del bucket R2 (C-009)
```

## Pasos

1. Registrar `barato.ar` en un registrar argentino (nic.ar) o proxy internacional.
2. Delegar nameservers a Cloudflare (opcional pero recomendado — proxy, WAF, DNS rápido).
3. Configurar records SPF/DKIM/DMARC según los valores que Resend imprime al agregar el dominio.
4. En el dashboard de Resend → `Domains → barato.ar → Verify`.
5. Enviar email de prueba desde `alertas@barato.ar` a una casilla externa; validar headers Authentication-Results.

## Verificación

```bash
dig TXT barato.ar +short
dig TXT resend._domainkey.barato.ar +short
dig TXT _dmarc.barato.ar +short

# Herramienta pública
https://mxtoolbox.com/domain/barato.ar
```
