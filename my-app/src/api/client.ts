export const BASE_URL = "";
export const WS_BASE_URL = "/ws-stomp";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
    method?: HttpMethod;
    body?: unknown;
};

export class ApiError extends Error {
    status: number;
    responseText: string;

    constructor(status: number, responseText: string) {
        super(`요청 실패: ${status}`);
        this.name = "ApiError";
        this.status = status;
        this.responseText = responseText;
    }
}

export class LoginRequiredError extends Error {
    status: number;
    responseText: string;

    constructor(status: number, responseText: string) {
        super("로그인 세션이 만료되었거나 인증되지 않았습니다. 다시 로그인해주세요.");
        this.name = "LoginRequiredError";
        this.status = status;
        this.responseText = responseText;
    }
}

function isHtmlResponse(text: string) {
    const trimmedText = text.trim().toLowerCase();

    return (
        trimmedText.startsWith("<!doctype html") ||
        trimmedText.startsWith("<html") ||
        trimmedText.includes("<body") ||
        trimmedText.includes("</html>")
    );
}

export async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body } = options;

    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const url = endpoint.startsWith("http")
        ? endpoint
        : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method,
        headers,
        credentials: "include",
        cache: "no-store",
        redirect: "manual",
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    console.log("요청 URL:", url);
    console.log("요청 Method:", method);
    console.log("응답 상태:", response.status);
    console.log("응답 Content-Type:", response.headers.get("content-type"));
    console.log("브라우저에서 접근 가능한 쿠키:", document.cookie);

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();

    if (
        response.status === 0 ||
        response.type === "opaqueredirect" ||
        response.status === 301 ||
        response.status === 302 ||
        response.status === 303 ||
        response.status === 307 ||
        response.status === 308
    ) {
        console.error("로그인 페이지로 리다이렉트된 응답:", {
            status: response.status,
            type: response.type,
            url: response.url,
            body: text,
        });

        throw new LoginRequiredError(
            response.status,
            "서버가 API 응답 대신 로그인 페이지로 리다이렉트했습니다."
        );
    }

    if (response.status === 401 || response.status === 403) {
        console.error("권한 에러 응답:", text);

        throw new LoginRequiredError(
            response.status,
            text || "로그인이 필요합니다."
        );
    }

    if (!response.ok) {
        console.error("에러 응답:", text);

        throw new ApiError(response.status, text);
    }

    if (!text) {
        return undefined as T;
    }

    /*
     * 핵심 수정:
     * Content-Type이 application/json이면 본문 안에 "/login", "sign in", "html" 같은 단어가 있어도
     * 로그인 페이지로 오해하면 안 된다.
     * AI 과제 응답에는 코드 설명이 들어갈 수 있어서 이런 단어들이 정상적으로 포함될 수 있다.
     */
    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(text) as T;
        } catch (error) {
            console.error("JSON 파싱 실패:", text);
            throw new Error("서버 JSON 응답을 해석하지 못했습니다.");
        }
    }

    /*
     * JSON이 아닌데 HTML이면 진짜 로그인 페이지나 index.html이 넘어온 상황으로 판단한다.
     */
    if (isHtmlResponse(text)) {
        console.error("HTML 응답:", text);

        throw new LoginRequiredError(
            response.status,
            "서버가 API 데이터 대신 HTML을 반환했습니다. 로그인 세션 또는 프록시 설정을 확인하세요."
        );
    }

    console.error("JSON이 아닌 응답:", text);

    throw new Error(
        "서버가 JSON이 아닌 응답을 반환했습니다. API 응답 형식 또는 로그인 세션을 확인하세요."
    );
}