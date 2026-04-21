# Bonatto Motoboy — App Mobile

Aplicativo nativo (React Native + Expo) para os motoboys da Bonatto Pizza. Conectado diretamente ao backend em `bonatto.com.br`.

## Funcionalidades

- Login seguro via PIN numérico
- Dashboard do dia: entregas, ganhos e avaliação
- Lista de pedidos atribuídos em tempo real (atualiza a cada 10s)
- GPS em segundo plano com envio de localização ao servidor
- Abertura direta no Google Maps ou Waze
- Confirmação de entrega com notificação automática ao cliente
- Histórico de entregas do dia
- Notificações push nativas (FCM/APNs)

## Stack

- **React Native** + **Expo SDK 53**
- **TypeScript**
- **tRPC Client** → conectado a `https://bonatto.com.br/trpc`
- **React Query** (gerenciamento de estado e cache)
- **expo-location** (GPS foreground + background)
- **expo-notifications** (push notifications nativas)
- **expo-secure-store** (armazenamento seguro do token)
- **React Navigation** (navegação entre telas)

## Estrutura do Projeto

```
App.tsx                    → Ponto de entrada, providers
app.json                   → Configurações do Expo (nome, permissões, bundle ID)
src/
  context/
    AuthContext.tsx         → Gerenciamento de autenticação (token + driver)
  screens/
    LoginScreen.tsx         → Tela de login com teclado PIN
    HomeScreen.tsx          → Dashboard principal + lista de pedidos
  components/
    OrderCard.tsx           → Card de pedido expansível
  hooks/
    useGps.ts               → GPS foreground + background
    usePushNotifications.ts → Registro e recebimento de notificações push
  lib/
    trpc.ts                 → Cliente tRPC configurado para bonatto.com.br
```

## Como Testar no Celular (Expo Go)

1. Instale o **Expo Go** na Play Store ou App Store
2. No terminal, dentro desta pasta, execute:
   ```bash
   npx expo start
   ```
3. Escaneie o QR Code com o Expo Go (Android) ou com a câmera (iOS)
4. O app abrirá conectado ao servidor real de produção

> **Nota:** GPS em segundo plano e notificações push requerem build nativo (EAS Build). No Expo Go, apenas o GPS em primeiro plano funciona.

## Como Fazer o Build para as Lojas

### Pré-requisitos
- Conta Expo (gratuita): https://expo.dev
- EAS CLI instalado: `npm install -g eas-cli`
- Conta Google Play Developer ($25 USD, taxa única)
- Conta Apple Developer ($99 USD/ano)

### Passo a Passo

```bash
# 1. Login no Expo
eas login

# 2. Configurar o projeto (gera o projectId)
eas init

# 3. Configurar os builds
eas build:configure

# 4. Build para Android (gera .aab para Play Store)
eas build --platform android

# 5. Build para iOS (gera .ipa para App Store)
eas build --platform ios

# 6. Submeter para as lojas
eas submit --platform android
eas submit --platform ios
```

## Ajuste Necessário no Backend

Para que o login por PIN funcione no app mobile, o backend precisa expor a procedure `drivers.loginByPin`. Verifique se ela existe no servidor ou adicione:

```typescript
// Em server/routers.ts, dentro do namespace drivers:
loginByPin: publicProcedure
  .input(z.object({ pin: z.string() }))
  .mutation(async ({ input }) => {
    const driver = await getDriverByPin(input.pin);
    if (!driver) throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN inválido" });
    return { token: driver.accessToken, driver: { id: driver.id, name: driver.name } };
  }),
```

## Ajuste Necessário no Backend (Push Notifications)

Para salvar o token de push nativo (Expo Push Token), adicione ao backend:

```typescript
saveExpoPushToken: publicProcedure
  .input(z.object({ token: z.string(), expoPushToken: z.string() }))
  .mutation(async ({ input }) => {
    const driver = await getDriverByToken(input.token);
    if (!driver) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido" });
    await saveDriverExpoPushToken(driver.id, input.expoPushToken);
    return { ok: true };
  }),
```

## Identidade Visual

- **Cor primária:** `#6E0D12` (bordô Bonatto)
- **Fundo:** `#0f0204` (preto escuro)
- **Acento verde:** `#34d399` (ganhos/entregue)
- **Acento amarelo:** `#fde047` (avaliação)
- **Logo:** CDN GitHub Assets Bonatto
