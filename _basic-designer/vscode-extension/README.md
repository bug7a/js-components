# basic.js Designer — VS Code eklentisi (alfa, v0.0.9)

basic.js ile yazılmış bir sayfayı VS Code içinde **basic.js Designer** ile açar ve değişikliklerin prompt'unu
**Claude Code** ya da **Codex**'e gönderir.

**Yapay zeka gerekir:** designer'da yapılan değişiklikler dosyaya kendiliğinden yazılmaz; dosyaları Claude Code
ya da Codex değiştirir (en az birinin CLI'ı kurulu olmalı). Açmak, katmanlara ve `dosya:satır` bilgisine bakmak
için gerekmez.

## Kullanım

1. Explorer'da bir `.htm` / `.html` dosyasına sağ tıkla → **Open in basic.js Designer**.
   (Açık bir `.htm` dosyasının sekmesine sağ tıklayınca da çıkar.) Sayfa designer'da, bir sekmede açılır.
   Aynı depodan başka bir sayfa aynı sekmeye yüklenir.
2. Değişiklikleri yap (designer'ın kendisi gibi).
3. **Send to AI** (üst barda kâğıt uçak, ya da Changes'in altındaki buton, ya da menü):
   VS Code'un üstünde iki seçim çıkar: **hangi yapay zeka** (yalnızca PATH'te bulunanlar seçilebilir) ve **model**
   (`Default` = CLI'nın kendi ayarı, listedekiler, ya da "Other model…").
   Son seçim en üstte "the last choice" olarak durur: bir tıkla aynısı.
4. CLI, deponun kökünde, adı "basic.js Designer → Claude Code" olan bir terminalde prompt ile başlar.
   Konuşmaya oradan devam edilir.
5. **Kendiliğinden yeniden yükleme:** Send'den sonra sayfanın dosyaları (sayfa, scriptleri, CSS'leri) izlenir.
   Yapay zeka birini değiştirip 1,5 sn durunca designer sayfayı yeniden yükler; gönderilen değişiklikler artık
   koddadır, kayıtlı oturum silinir (iki kez uygulanmasın). Yapay zeka devam edip yine değiştirirse yine yüklenir.
   Send'den sonra designer'da **yeni** bir değişiklik yaptıysan yüklemez (o değişiklik kaybolmasın): alt çubuk
   "kod değişti, hazır olunca ↻" der. Bir sonraki Send'e ya da designer kapanana kadar izlenir.
6. **Prompt'lar saklanır:** her gönderilen prompt `_basic-designer/prompts/` içinde bir `.md` dosyası
   olur, adı: `2026-10-26_0850-12_tabs_claude-sonnet.md` (zaman, sayfa, yapay zeka, model). Bu klasör git'e girmez.

Designer'daki `dosya:satır` bağlantıları (alt çubuk, katmanlar) dosyayı yanda, o satırda açar.

## Nasıl çalışır

- `lib/server.js`: deponun kökünü (`designerPath`'i bulunan ilk üst klasör) **yalnızca 127.0.0.1**'den, boş bir
  porttan veren küçük bir sunucu (GET/HEAD, kökün dışı yok, `no-store`). Designer ile sayfa aynı adresten gelmeli:
  designer sayfanın içine erişir. Live Server gerekmez. "basic.js Designer: Stop the page server" kapatır.
- `lib/webview.js`: webview yalnızca designer'ın iframe'i ve bir köprü: designer ↔ eklenti mesajları
  (`sendPrompt`, `openFile` / `status`, `load`).
- `extension.js` istekleri (`type: "request"`, cevabı `type: "reply"` + `id`): `listFolder { folder }` → bir klasördeki
  klasörler ve `.htm` dosyalar (designer'ın Open Folder…'ı); `createFile { folder, name, content }` → yeni bir dosya
  (New page…; `flag: "wx"`: var olan dosyanın üstüne yazmaz); `saveImage { name, dataUrl }` → `promptsFolder/images/` içine bir resim (Design from image…; PNG / JPEG / WebP / GIF, en çok 15 MB). Kökün dışına çıkmazlar.
- Designer (`index.htm`, `designer.js`) diskten okunur: designer'daki bir değişiklik için eklentiyi yeniden paketlemek
  gerekmez, yalnızca designer sekmesini yeniden açmak yeter. Paket yalnızca `extension.js` / `lib/` değişince yenilenir.
- `lib/agents.js`: komut, terminalin kabuğuna göre (`vscode.env.shell`):
  - zsh / bash (macOS, Linux, Windows'ta Git Bash / WSL): prompt'un tamamı dosyasından tek argüman olarak:
    `claude --model 'sonnet' "$(cat '…/prompts/….md')"`, `codex -m 'gpt-6.1-sol' "…"`.
  - PowerShell / cmd (Windows): bir talimat: `& 'claude' --model 'sonnet' 'Read the prompt in the file
    _basic-designer/prompts/….md and do what it says.'` (PowerShell 5.1 bir argümanın içindeki çift
    tırnakları atar: çok satırlı, tırnaklı prompt orada bozulurdu). CLI'lar Windows'ta `where.exe` ile bulunur.
- `lib/watcher.js`: dosyaları değil klasörlerini izler (bir dosya "yeni dosya + yeniden adlandırma" ile
  kaydedilince dosya izleyicisi dururdu); değişiklikler durunca tek bir bildirim.
- Designer (`designer.js`, `*** VS CODE:` bölümü) `?host=vscode` ile açıldığını anlar: Send düğmeleri çıkar,
  kod bağlantıları `vscode://` yerine eklentiye gider. Tarayıcıda her şey eskisi gibi (Copy prompt).

## Ayarlar

| Ayar | Varsayılan |
|---|---|
| `basicDesigner.designerPath` | `_basic-designer/index.htm` |
| `basicDesigner.promptsFolder` | `_basic-designer/prompts` (boş: sistemin geçici klasörü) |
| `basicDesigner.reloadAfterSend` | `true` |
| `basicDesigner.claude.command` / `.models` | `claude` / `sonnet`, `opus`, `haiku` |
| `basicDesigner.codex.command` / `.models` | `codex` / `gpt-6.1-sol`, `gpt-6-astra` |

## Kurulum

`basic-designer-0.0.9-alpha.vsix` (bu klasörde; alfa): Komut paleti → **Extensions: Install from VSIX…** ya da
`code --install-extension basic-designer-0.0.9-alpha.vsix`

## Sınırlar (deneme)

- Windows komutları (PowerShell, cmd) yalnızca metin olarak denendi: bir Windows makinesinde çalıştırılmadı.
- "İş bitti" doğrudan bilinemez (CLI açık kalır): dosyalar değişip durunca bitti sayılır. Uzun düşünen bir yapay
  zeka bir dosyayı yazıp 1,5 sn sonra bir başkasını yazarsa sayfa iki kez yüklenir.
- Prompt Claude Code / Codex'in **sohbet paneline** değil, **terminaldeki CLI**'ya gider: bu eklentilerin
  "şu prompt'u gönder" diye açık bir komutu yok (olsaydı da her sürümde değişebilirdi).
- Eklenti çalışırken depo `127.0.0.1:<port>` üzerinden okunabilir (yalnızca bu bilgisayardan).
