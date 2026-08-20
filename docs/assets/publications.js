/* 연도별 학회 논문 출판 현황 — 제공된 시안의 예시 데이터.
 * 실제 통계로 교체할 때 동일한 { years, records } 구조를 유지하세요. */
window.KIISE_PUBLICATIONS = {
  sample: true,
  years: [2022, 2023, 2024, 2025, 2026],
  records: [
    { abbr: "IEEE INFOCOM", field: "네트워크", counts: [162, 189, 207, 226, 238] },
    { abbr: "IEEE ICC", field: "네트워크", counts: [148, 167, 188, 206, 212] },
    { abbr: "IEEE GLOBECOM", field: "네트워크", counts: [121, 139, 156, 176, 195] },
    { abbr: "ACM SIGCOMM", field: "네트워크", counts: [96, 112, 129, 145, 168] },
    { abbr: "ACM MobiCom", field: "네트워크", counts: [76, 92, 108, 122, 139] },
    { abbr: "IEEE ICDCS", field: "분산시스템", counts: [68, 81, 94, 106, 121] },
    { abbr: "ACM SenSys", field: "네트워크", counts: [52, 63, 74, 85, 98] },
    { abbr: "USENIX ATC", field: "운영체제", counts: [39, 47, 55, 63, 72] },
    { abbr: "IEEE WCNC", field: "네트워크", counts: [46, 55, 64, 73, 85] },
    { abbr: "IEEE VTC", field: "네트워크", counts: [41, 48, 56, 64, 72] }
  ]
};
