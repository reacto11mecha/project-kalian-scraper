# Project Kalian API

Ini adalah sebuah project yang mengolah file README.md dari repositori https://github.com/sandhikagalih/project-kalian dari masing-masing branch menjadi data json yang berisikan list-list project yang sudah di showcase di channel youtube [Web Programming UNPAS](https://www.youtube.com/@sandhikagalihWPU/streams). Selain data JSON, terdapat gambar screenshot berdasarkan link yang dicantumkan berdasar project yang di showcase.

Terdapat otomasi [github action](./.github/workflows/scraper.yml) yang akan memperbarui list setiap hari sabtu jam 19:30.

## Daftar Endpoint

- ### `/all.json`

  Full Link: https://api.project-kalian.rmecha.my.id/all.json

  Data project showcase yang di kategorikan berdasarkan season.

- ### `/projects-by-latest.json`

  Full Link: https://api.project-kalian.rmecha.my.id/projects-by-latest.json

  List project yang dijadikan satu sebagai list showcase project yang terbaru sampai terlama.

- ### `/projects-by-oldest.json`

  Full Link: https://api.project-kalian.rmecha.my.id/projects-by-oldest.json

  List project yang dijadikan satu sebagai list showcase project yang terlama sampai terbaru.

- ### `/img/*.png`

  Full Link: https://api.project-kalian.rmecha.my.id/img

  Folder yang berisikan gambar-gambar hasil screenshot dari link yang disertakan pada setiap projectnya.

## Schema [`zod`](https://zod.dev/)

Project ini menggunakan zod sebagai validator, sangat membantu jika mengonsumsi API menggunakan TypeScript maupun menggunakan JavaScript hanya untuk validasi format data yang diterima.

Format `/all.json`:

```js
const z = require("zod");

const allJson = z.object({
  fetched_at: z.date(),
  data: z.array(
    z.object({
      season: z.string(),
      dates: z.array(
        z.object({
          date: z.string(),
          projects: z.array(
            z.object({
              link: z.string().url(),
              username: z.string(),
              message: z.string(),
              image: z.string(),
            })
          ),
        })
      ),
    })
  ),
});
```

Format `/projects-by-*.json`:

```js
const z = require("zod");

const byProjects = z.object({
  fetched_at: z.date(),
  data: z.array(
    z.object({
      season: z.string(),
      showcaseDate: z.string(),
      projectLink: z.string(),
      projectIdx: z.number(),
      username: z.string(),
      message: z.string(),
      image: z.string(),
    })
  ),
});
```

## Local Development

1. Clone repositori ini.
2. Install dependensi yang diperlulkan menggunakan `pnpm install`.
3. Menjalankan scraper menggunakan `pnpm start`.
