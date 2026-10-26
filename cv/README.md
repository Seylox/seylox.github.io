# CV

LaTeX source of my CV. Excluded from the Jekyll build (see `_config.yml`), so nothing here is served on the site.

## Updating the CV

1. Edit `cv.tex`. All content lives there; the other `.tex` files only switch variants.
2. Build all three variants (see [Building](#building)) and check the PDFs. Keep it at two pages.
3. Commit `cv.tex` and `cv-public.pdf` together, so the two never drift apart.
4. Copy the changed files to Google Drive by hand (see [Syncing with Google Drive](#syncing-with-google-drive)).

Things to know when editing `cv.tex`:

- Sections are `longtable`s with a date column and a text column. One row is `date&text\\`, followed by `\RowRule` for the grey separator line (leave it off the last row of a table).
- A row cannot break across pages. Long entries are split into several rows with an empty date column (`&text\\[0.4em]`), like the Anyline entry, so the page can break between them.
- Personal data is never written into `cv.tex` directly. Use the macros (`\cvStreetAddress`, `\cvPostalCode`, `\cvPhone`, ...), see below.
- No em dashes. Use `--` only for date ranges.

## Personal data stays out of git

Street address, postal code, phone number, date of birth, place of birth and citizenship never go into this repo. `cv.tex` only references them as macros, which come from one of two files:

| File | Contents | In git? |
|---|---|---|
| `personal-data.tex` | The real values. Marked SENSITIVE in its header. | No (gitignored). Its home is the Google Drive CV folder. |
| `personal-data.public.tex` | Placeholders that render as grey "[... withheld]" markers. | Yes |

To change a value (e.g. a new phone number), edit `personal-data.tex` only. When adding a new personal field, add the macro to both files.

## Variants

| Build from | Output | Personal data | Photo | In git? |
|---|---|---|---|---|
| `cv.tex` | `cv.pdf`, the full CV (DACH applications) | real | yes | No (gitignored) |
| `cv-international.tex` | `cv-international.pdf`, the full CV without photo (international applications) | real | no | No (gitignored) |
| `cv-public.tex` | `cv-public.pdf`, the public CV | placeholders | yes | Yes |

The wrappers only set switches before including `cv.tex`: `\cvpublic` selects the placeholders and adds the footer "Public version: personal details withheld. Full CV available on request." on every page; `\cvnophoto` drops the photo.

## Building

Requires [Tectonic](https://tectonic-typesetting.github.io/) (`brew install tectonic`). It downloads the LaTeX packages it needs on the first run.

```bash
cd cv
tectonic cv.tex && tectonic cv-international.tex && tectonic cv-public.tex
```

Building `cv.tex` or `cv-international.tex` without `personal-data.tex` stops with an error instead of silently producing a CV with placeholders.

## Files

- `cv.tex`: the CV itself
- `cv-international.tex`, `cv-public.tex`: wrappers that switch `cv.tex` into a variant
- `personal-data.public.tex`: placeholders, see above
- `DSC08898_small.jpg`: the photo in the header
- `cv-public.pdf`: the committed public build

## Syncing with Google Drive

The Google Drive folder "Bernd Kampl Lebenslauf Latex CV" keeps everything that does not belong in git: `personal-data.tex`, the full PDFs, past CV PDFs, the full-resolution photo, and the `cover_letter/` folder. Syncing is a manual copy from here to Drive: the files listed under [Files](#files), plus `personal-data.tex`, `cv.pdf` and `cv-international.pdf`. Do not sync with a delete option (e.g. `rsync --delete`), or the Drive-only files are gone.
