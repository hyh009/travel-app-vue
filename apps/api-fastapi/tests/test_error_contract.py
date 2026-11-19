import re
from pathlib import Path

from app.core.errors import ERRORS, ErrorCode

# tests/ -> api-fastapi/ -> apps/ -> 專案根目錄
SHARED_ERRORS_TS = Path(__file__).parents[3] / "packages/shared/src/errors.ts"


def shared_error_codes() -> set[str]:
    source = SHARED_ERRORS_TS.read_text()
    block = re.search(r"ERROR_CODES = \[(.*?)\] as const", source, re.DOTALL)
    assert block, "在 errors.ts 找不到 ERROR_CODES"
    codes = set(re.findall(r"'([A-Z_]+)'", block.group(1)))
    # 一個都撈不到,代表是讀取失敗(例如 Prettier 改成雙引號),不是內容不一致
    assert codes, (
        "找到 ERROR_CODES,但裡面沒撈到任何單引號的錯誤碼,errors.ts 的寫法可能變了"
    )
    return codes


def test_codes_match_shared_contract():
    assert {code.value for code in ErrorCode} == shared_error_codes()


def test_every_code_has_status_and_message():
    assert set(ERRORS) == set(ErrorCode)
