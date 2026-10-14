<p align="center">
  <img src="https://raw.githubusercontent.com/sendkuy/sendkuy-node/main/art/banner.png" alt="SendKuy for Node.js" width="100%">
</p>

# SendKuy for Node.js

Kirim WhatsApp, SMS, dan email dari Node.js, Bun, Deno, dan edge runtime. Respons bertipe, dan retry-nya tidak pernah mengirim dobel.

> **Status:** belum dirilis. Rilis pertama, 1.0.0, sedang disiapkan. Beri star atau watch repo ini supaya kamu tahu saat rilis.

[Read in English](README.md)

## Instalasi

```bash
npm i sendkuy
```

Tanpa dependensi: SDK hanya memakai `fetch` dan Web Crypto. CI menguji Node.js 20.3+, Bun, dan Deno di setiap perubahan, sedangkan Cloudflare Workers dan Vercel Edge menyediakan kedua API yang sama.

## Mulai cepat

```ts
import { SendKuy } from 'sendkuy';

const sendkuy = new SendKuy(); // membaca SENDKUY_API_KEY

const [message] = await sendkuy.messages.send({
  channel: 'whatsapp',
  to: ['+6281234567890'],
  body: 'Pesanan kamu sedang dikirim.',
});
```

Buat API key di [dashboard SendKuy](https://app.sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node), menu **Developers → Keys**.

## Retry dan idempotensi

Setiap request tulis otomatis membawa `Idempotency-Key`, dan setiap retry memakai key yang sama, jadi timeout tidak pernah berakhir dengan pesan terkirim dua kali. Kalau kode kamu sendiri yang mengulang, beri key dari data yang stabil:

```ts
await sendkuy.messages.send(params, { idempotencyKey: 'order-1042-shipped' });
```

## Webhook

```ts
const event = await verifyWebhook({
  payload: await request.text(),
  signature: request.headers.get('x-sendkuy-signature'),
  secret: process.env.SENDKUY_WEBHOOK_SECRET!,
});
```

Pakai body mentah (bukan hasil `request.json()`) dan secret utuh, termasuk `whsec_`.

## Hanya untuk server

API key bisa mengirim pesan dan memakai kredit, jadi SDK menolak berjalan di browser. Panggil SendKuy dari server, API route, atau edge function.

Dokumentasi lengkap ada di [README bahasa Inggris](README.md) dan [docs.sendkuy.com](https://docs.sendkuy.com/?utm_source=readme&utm_medium=sdk&utm_campaign=sendkuy-node).

## Lisensi

MIT.
