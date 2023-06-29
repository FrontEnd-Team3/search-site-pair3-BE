/*
- json-server: JSON server 사용하기 위한 모듈
- data: DB로 사용될 JSON 파일을 가져옴
- Hangul: 한글 처리를 위한 모듈. 초성 검색 구현 시 사용
- cors: CORS(Cross-Origin Resource Sharing)를 처리하기 위한 middle-ware
*/
const jsonServer = require("json-server");
const data = require("./db.json");
const Hangul = require("hangul-js");
/*
CORS?
- 웹 애플리케이션에서 다른 도메인 또는 포트의 리소스에 접근할 수 있는 권한을 부여하는 매커니즘
- 기본적으로, 보안상의 이유 때문에 브라우저는 동일 출처 정책에 따라 다른 도메인에서 리소스를 요청할 수 없음
- CORS를 사용하면 서버 측에서 특정 도메인이나 포트에서 온 요청을 허용할 수 있음
- 이를 통해 웹 애플리케이션에서 여러 도메인의 리소스에 접근할 수 있게 됨
- 클라이언트에서 오는 요청에 대해 CORS 관련 헤더를 설정하여 동일 출처 정책 우회 가능
>> 다른 도메인에서 JSON Server의 API에 접근 가능
*/
const cors = require("cors");

// JSON server instance 생성
const server = jsonServer.create();
// JSON 파일을 기반으로 하는 라우팅 처리
const router = jsonServer.router("db.json");
// JSON server의 기본 middle-ware 사용 (logging, parsing, ...)
const middlewares = jsonServer.defaults();

server.use(middlewares);
// JSON Server의 애플리케이션에서 CORS를 처리하기 위해 미들웨어를 등록하는 역할을 하는 코드
// 모든 요청에 대해 CORS 관련 헤더를 설정하여 다른 도메인에서의 접근 허용
// 모든 도메인에서의 요청 및 HTTP 메서드(get, post, put, delete 등)를 허용
// 클라이언트 애플리케이션에서 JSON Server의 API에 접근 가능하게 됨
// 다시 말해, 이는 HTTP 응답 헤더에 Access-Control-Allow-Origin 등의 헤더를 추가해 CORS 정책을 우회할 수 있게 함
// 이를 통해 클라이언트와 서버 간의 CORS 관련 이슈를 간편하게 해결 가능
server.use(cors());

// Custom API endpoint
// 해당 endpoint에서 get 요청 처리
server.get("/search", (req, res) => {
  // req.query를 통해 검색어(key)를 가져옴
  const { key } = req.query;
  if (!key) {
    // 검색어가 없는 경우 400 error >> "검색어를 입력해주세요"
    return res.status(400).send("검색어를 입력해주세요.");
  }
  // 초성 검색 결과
  // filter를 사용하여 initials 배열에서 searchInitial으로 시작하는 초성이 있는 경우만 해당 제품을 포함시킴
  const initialsResult = data.products.filter((product) => {
    // 각 요소의 이름을 공백 기준으로 나누어 단어 배열로 만듦
    const words = product.split(" ");
    // 각 단어를 한 글자씩 분해한 후 분해된 글자를 다시 조합하여 초성으로 만듦
    // 이 과정을 모든 단어에 대해 수행 후 초성들의 배열 생성
    const initials = words.map((word) =>
      Hangul.disassemble(word)
        .map((char) => Hangul.assemble(char.charAt(0)))
        .join("")
    );
    // 검색어를 한 글자씩 분해한 후 분해된 글자를 다시 조합하여 검색어의 초성을 만듦
    const searchInitial = Hangul.disassemble(key)
      .map((char) => Hangul.assemble(char.charAt(0)))
      .join("");
    // initials에서 생성된 초성 배열에서 searchInitial의 초성과 일치하는 초성이 있는 지 확인
    // startwith: 검색어의 초성으로 시작하는 초성이 있는지 검사
    return initials.some((initial) => initial.startsWith(searchInitial));
  });

  // 단어 검색 결과
  const wordsResult = data.products.filter((product) => {
    // 각 상품에 대해 검색어(key)를 포함하는지 확인
    return product.includes(key);
  });

  // 중복 제거 및 결과 반환
  // 1. 초기 검색 결과와 단어 검색 결과를 병합하여 둘을 모두 포함하는 하나의 배열로 만듦
  // 2. set: 중복된 요소를 제거하기 위해 병합된 배열을 set 객체로 변환
  // 3. [...new Set]: set 객체를 다시 배열로 변환하여 중복이 제거된 최종 결과 배열을 얻음
  const result = [...new Set([...initialsResult, ...wordsResult])];

  // 검색 결과가 없는 경우 에러 처리 (404 error)
  if (result.length === 0) {
    return res.status(404).send("검색 결과가 없습니다.");
  }

  // 검색 결과를 JSON 형식으로 반환
  return res.json(result);
});

// 라우터 등록
server.use(router);
// 서버를 3030 포트에서 실행
server.listen(3000, () => {
  console.log("JSON Server is running");
});

// http://localhost:3000/search
