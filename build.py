"""Build the single-file, offline playable edition with only the Python standard library."""
import base64
import re
from pathlib import Path

root = Path(__file__).resolve().parent
page = (root / "screen.in.html").read_text().replace("/*__STYLE__*/", (root / "style.css").read_text())

def embed_asset(match):
    name = match[0]
    mime = "font/ttf" if name.endswith(".ttf") else "image/webp"
    encoded = base64.b64encode((root / name).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"

page = re.sub(r"art/[\w.-]+\.(?:webp|ttf)", embed_asset, page)
files = ["vendor/three.r180.min.js", "stage-art.js", "stage.js", "hit-regions.js", "final-smash.js", "sim.js", "native-fighter-data.js", "native-motions.js", "native-motion-player.js", "native-fighters.js", "fighters.js", "shadows.js", "puff-fx.js", "kirby-fx.js", "feedback.js", "battle-audio.js", "final-fx.js", "screen-ko.js", "game.js"]
scripts = []
for source in files:
    content = (root / source).read_text().replace("</script", r"<\/script")
    scripts.append(f"<script>\n// {source}\n{content}\n</script>")
licenses = "\n".join((root / name).read_text() for name in ("vendor/LICENSE-three.txt", "art/OFL.txt"))
page = page.replace("<!--__SCRIPTS__-->", "\n".join(scripts) + "\n<!--\n" + licenses + "\n-->")
(root / "index.html").write_text(page)
