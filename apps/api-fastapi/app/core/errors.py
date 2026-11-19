from dataclasses import dataclass
from enum import StrEnum


class ErrorCode(StrEnum):
    VALIDATION_FAILED = "VALIDATION_FAILED"
    INVALID_JSON = "INVALID_JSON"
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    INVALID_ACCESS_TOKEN = "INVALID_ACCESS_TOKEN"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    NO_REFRESH_TOKEN = "NO_REFRESH_TOKEN"
    INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    NOT_FOUND = "NOT_FOUND"
    PLACE_NOT_FOUND = "PLACE_NOT_FOUND"
    EMAIL_TAKEN = "EMAIL_TAKEN"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


@dataclass(frozen=True)
class ErrorInfo:
    status: int
    message: str


ERRORS: dict[ErrorCode, ErrorInfo] = {
    # 400
    ErrorCode.VALIDATION_FAILED: ErrorInfo(400, "Invalid input"),
    ErrorCode.INVALID_JSON: ErrorInfo(400, "Request body is not valid JSON"),
    # 401
    ErrorCode.NOT_AUTHENTICATED: ErrorInfo(401, "Not authenticated"),
    ErrorCode.INVALID_ACCESS_TOKEN: ErrorInfo(401, "Invalid or expired access token"),
    ErrorCode.INVALID_CREDENTIALS: ErrorInfo(401, "Invalid email or password"),
    ErrorCode.NO_REFRESH_TOKEN: ErrorInfo(401, "No refresh token"),
    ErrorCode.INVALID_REFRESH_TOKEN: ErrorInfo(401, "Invalid refresh token"),
    ErrorCode.USER_NOT_FOUND: ErrorInfo(401, "User no longer exists"),
    # 404
    ErrorCode.NOT_FOUND: ErrorInfo(404, "Route not found"),
    ErrorCode.PLACE_NOT_FOUND: ErrorInfo(404, "Place not found"),
    # 409
    ErrorCode.EMAIL_TAKEN: ErrorInfo(409, "Email already registered"),
    # 429
    ErrorCode.RATE_LIMITED: ErrorInfo(429, "Too many requests"),
    # 500
    ErrorCode.INTERNAL_ERROR: ErrorInfo(500, "Internal server error"),
}
