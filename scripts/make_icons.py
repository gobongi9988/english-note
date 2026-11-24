#!/usr/bin/env python3
"""홈 화면 아이콘 생성 — 어두운 타일 위 'EN' 마크.

사용법 (저장소 루트에서):  python3 scripts/make_icons.py
결과: icon-180.png(애플 터치, 꽉 찬 사각), icon-192.png, icon-512.png(둥근 모서리)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
S = 1024
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

BLUE_TOP = (126, 152, 255)
BLUE_BOT = (56, 70, 214)
INK = (10, 11, 13)


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BLUE_TOP)
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x * 0.35 + y * 0.65) / (size - 1)
            px[x, y] = (
                round(BLUE_TOP[0] + (BLUE_BOT[0] - BLUE_TOP[0]) * t),
                round(BLUE_TOP[1] + (BLUE_BOT[1] - BLUE_TOP[1]) * t),
                round(BLUE_TOP[2] + (BLUE_BOT[2] - BLUE_TOP[2]) * t),
            )
    return img


def base() -> Image.Image:
    img = gradient(S).convert("RGBA")
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 430)
    text = "EN"
    # 자간 살짝
    widths = [d.textlength(ch, font=font) for ch in text]
    total = sum(widths) + 18
    x = (S - total) / 2
    for ch, w in zip(text, widths):
        d.text((x, S / 2), ch, font=font, fill=(255, 255, 255, 255), anchor="lm")
        x += w + 18
    # 아래 짧은 밑줄
    d.rounded_rectangle((S * 0.30, S * 0.705, S * 0.70, S * 0.705 + S * 0.035),
                        radius=S * 0.018, fill=(255, 255, 255, 210))
    return img


def rounded(img: Image.Image, radius_ratio: float = 0.225) -> Image.Image:
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=S * radius_ratio, fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main() -> None:
    art = base()
    art.convert("RGB").resize((180, 180), Image.LANCZOS).save(ROOT / "icon-180.png")  # iOS가 모서리를 깎으므로 꽉 찬 사각
    rounded(art).resize((192, 192), Image.LANCZOS).save(ROOT / "icon-192.png")
    rounded(art).resize((512, 512), Image.LANCZOS).save(ROOT / "icon-512.png")
    print("아이콘 생성 완료: icon-180.png, icon-192.png, icon-512.png")


if __name__ == "__main__":
    main()
