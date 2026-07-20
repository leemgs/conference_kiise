// 주요 KIISE 우수 학회 논문 제출 마감 일정 (수동 관리).
// 날짜는 직전 개최 연도 일정을 기반으로 한 "예상치"이므로,
// 실제 마감일은 반드시 각 학회 공식 홈페이지에서 확인해야 한다.
// abbr 은 data.js 의 약칭과 일치해야 캘린더 칩이 학회 정보와 연결된다.
window.KIISE_DEADLINES = {
  updated: "2026-07-20",
  items: [
    /* ---- 2026-07 ---- */
    { abbr: "SIGMETRICS", edition: "2027", kind: "초록", date: "2026-07-03", note: "1차 라운드" },
    { abbr: "SODA", edition: "2027", kind: "초록", date: "2026-07-06" },
    { abbr: "SODA", edition: "2027", kind: "논문", date: "2026-07-09" },
    { abbr: "POPL", edition: "2027", kind: "논문", date: "2026-07-09" },
    { abbr: "SIGMETRICS", edition: "2027", kind: "논문", date: "2026-07-10", note: "1차 라운드" },
    { abbr: "SIGMOD", edition: "2027", kind: "초록", date: "2026-07-10", note: "1차 라운드" },
    { abbr: "CHES", edition: "2027", kind: "논문", date: "2026-07-15", note: "분기 마감" },
    { abbr: "SIGMOD", edition: "2027", kind: "논문", date: "2026-07-17", note: "1차 라운드" },
    { abbr: "AAAI", edition: "2027", kind: "초록", date: "2026-07-21" },
    { abbr: "NDSS", edition: "2027", kind: "논문", date: "2026-07-22", note: "2차 라운드" },
    { abbr: "INFOCOM", edition: "2027", kind: "초록", date: "2026-07-24" },
    { abbr: "HPCA", edition: "2027", kind: "초록", date: "2026-07-24" },
    { abbr: "ICSE", edition: "2027", kind: "논문", date: "2026-07-24", note: "2차 라운드" },
    { abbr: "AAAI", edition: "2027", kind: "논문", date: "2026-07-28" },
    { abbr: "INFOCOM", edition: "2027", kind: "논문", date: "2026-07-31" },
    { abbr: "HPCA", edition: "2027", kind: "논문", date: "2026-07-31" },

    /* ---- 2026-08 ---- */
    { abbr: "KDD", edition: "2027", kind: "초록", date: "2026-08-01", note: "1차 라운드" },
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2026-08-01", note: "롤링(매월 1일)" },
    { abbr: "UBICOMP", edition: "2027", kind: "논문", date: "2026-08-01", note: "IMWUT 분기 마감" },
    { abbr: "WSDM", edition: "2027", kind: "초록", date: "2026-08-03" },
    { abbr: "PPoPP", edition: "2027", kind: "초록", date: "2026-08-04" },
    { abbr: "WSDM", edition: "2027", kind: "논문", date: "2026-08-06" },
    { abbr: "KDD", edition: "2027", kind: "논문", date: "2026-08-08", note: "1차 라운드" },
    { abbr: "PPoPP", edition: "2027", kind: "논문", date: "2026-08-11" },
    { abbr: "MobiCom", edition: "2027", kind: "논문", date: "2026-08-15", note: "2차 라운드" },
    { abbr: "USENIX Security", edition: "2027", kind: "논문", date: "2026-08-26", note: "1차 라운드" },

    /* ---- 2026-09 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2026-09-01", note: "롤링(매월 1일)" },
    { abbr: "CHI", edition: "2027", kind: "초록", date: "2026-09-03" },
    { abbr: "USENIX NSDI", edition: "2027", kind: "초록", date: "2026-09-04" },
    { abbr: "CHI", edition: "2027", kind: "논문", date: "2026-09-10" },
    { abbr: "USENIX NSDI", edition: "2027", kind: "논문", date: "2026-09-11" },
    { abbr: "FSE", edition: "2027", kind: "논문", date: "2026-09-11" },
    { abbr: "ICRA", edition: "2027", kind: "논문", date: "2026-09-15" },
    { abbr: "EuroSys", edition: "2027", kind: "논문", date: "2026-09-17", note: "가을 라운드" },
    { abbr: "ICASSP", edition: "2027", kind: "논문", date: "2026-09-17" },
    { abbr: "ICLR", edition: "2027", kind: "초록", date: "2026-09-18" },
    { abbr: "USENIX FAST", edition: "2027", kind: "논문", date: "2026-09-22" },
    { abbr: "ICLR", edition: "2027", kind: "논문", date: "2026-09-23" },

    /* ---- 2026-10 ---- */
    { abbr: "EUROCRYPT", edition: "2027", kind: "논문", date: "2026-10-01" },
    { abbr: "IPDPS", edition: "2027", kind: "초록", date: "2026-10-01" },
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2026-10-01", note: "롤링(매월 1일)" },
    { abbr: "WWW", edition: "2027", kind: "초록", date: "2026-10-06" },
    { abbr: "NAACL", edition: "2027", kind: "논문", date: "2026-10-06", note: "ARR 마감" },
    { abbr: "ICDE", edition: "2027", kind: "논문", date: "2026-10-07", note: "1차 라운드" },
    { abbr: "IPDPS", edition: "2027", kind: "논문", date: "2026-10-08" },
    { abbr: "AAMAS", edition: "2027", kind: "초록", date: "2026-10-08" },
    { abbr: "WWW", edition: "2027", kind: "논문", date: "2026-10-13" },
    { abbr: "ASPLOS", edition: "2027", kind: "논문", date: "2026-10-13", note: "가을 라운드" },
    { abbr: "AAMAS", edition: "2027", kind: "논문", date: "2026-10-15" },
    { abbr: "CSCW", edition: "2027", kind: "논문", date: "2026-10-15" },
    { abbr: "CHES", edition: "2027", kind: "논문", date: "2026-10-15", note: "분기 마감" },
    { abbr: "OOPSLA", edition: "2027", kind: "논문", date: "2026-10-20", note: "1차 라운드" },
    { abbr: "ISSTA", edition: "2027", kind: "논문", date: "2026-10-29" },

    /* ---- 2026-11 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2026-11-01", note: "롤링(매월 1일)" },
    { abbr: "UBICOMP", edition: "2027", kind: "논문", date: "2026-11-01", note: "IMWUT 분기 마감" },
    { abbr: "STOC", edition: "2027", kind: "논문", date: "2026-11-03" },
    { abbr: "CVPR", edition: "2027", kind: "초록", date: "2026-11-06" },
    { abbr: "PLDI", edition: "2027", kind: "논문", date: "2026-11-10" },
    { abbr: "S&P", edition: "2027", kind: "논문", date: "2026-11-12", note: "2차 라운드" },
    { abbr: "CVPR", edition: "2027", kind: "논문", date: "2026-11-13" },
    { abbr: "ISCA", edition: "2027", kind: "초록", date: "2026-11-13" },
    { abbr: "DAC", edition: "2027", kind: "초록", date: "2026-11-13" },
    { abbr: "ISCA", edition: "2027", kind: "논문", date: "2026-11-20" },
    { abbr: "DAC", edition: "2027", kind: "논문", date: "2026-11-20" },

    /* ---- 2026-12 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2026-12-01", note: "롤링(매월 1일)" },
    { abbr: "MobiSys", edition: "2027", kind: "논문", date: "2026-12-01" },
    { abbr: "USENIX OSDI", edition: "2027", kind: "초록", date: "2026-12-03" },
    { abbr: "USENIX OSDI", edition: "2027", kind: "논문", date: "2026-12-10" },

    /* ---- 2027-01 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2027-01-01", note: "롤링(매월 1일)" },
    { abbr: "IJCAI", edition: "2027", kind: "초록", date: "2027-01-08" },
    { abbr: "CCS", edition: "2027", kind: "논문", date: "2027-01-12", note: "1차 라운드" },
    { abbr: "USENIX ATC", edition: "2027", kind: "논문", date: "2027-01-13" },
    { abbr: "SIGIR", edition: "2027", kind: "초록", date: "2027-01-14" },
    { abbr: "CAV", edition: "2027", kind: "초록", date: "2027-01-14" },
    { abbr: "IJCAI", edition: "2027", kind: "논문", date: "2027-01-15" },
    { abbr: "CHES", edition: "2027", kind: "논문", date: "2027-01-15", note: "분기 마감" },
    { abbr: "ACL", edition: "2027", kind: "논문", date: "2027-01-19", note: "ARR 마감" },
    { abbr: "SIGIR", edition: "2027", kind: "논문", date: "2027-01-21" },
    { abbr: "CAV", edition: "2027", kind: "논문", date: "2027-01-21" },
    { abbr: "SIGGRAPH", edition: "2027", kind: "논문", date: "2027-01-21" },
    { abbr: "ICML", edition: "2027", kind: "초록", date: "2027-01-23" },
    { abbr: "ICML", edition: "2027", kind: "논문", date: "2027-01-28" },
    { abbr: "RSS", edition: "2027", kind: "논문", date: "2027-01-29" },
    { abbr: "SIGCOMM", edition: "2027", kind: "초록", date: "2027-01-29" },

    /* ---- 2027-02 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2027-02-01", note: "롤링(매월 1일)" },
    { abbr: "UBICOMP", edition: "2027", kind: "논문", date: "2027-02-01", note: "IMWUT 분기 마감" },
    { abbr: "USENIX Security", edition: "2027", kind: "논문", date: "2027-02-03", note: "2차 라운드" },
    { abbr: "SIGCOMM", edition: "2027", kind: "논문", date: "2027-02-05" },
    { abbr: "SIGMETRICS", edition: "2027", kind: "논문", date: "2027-02-05", note: "3차 라운드" },
    { abbr: "CRYPTO", edition: "2027", kind: "논문", date: "2027-02-10" },

    /* ---- 2027-03 ---- */
    { abbr: "VLDB", edition: "2027", kind: "논문", date: "2027-03-01", note: "롤링 마지막 마감" },
    { abbr: "IROS", edition: "2027", kind: "논문", date: "2027-03-02" },
    { abbr: "ICCV", edition: "2027", kind: "초록", date: "2027-03-03" },
    { abbr: "InterSpeech", edition: "2027", kind: "논문", date: "2027-03-03" },
    { abbr: "ICCV", edition: "2027", kind: "논문", date: "2027-03-08" },
    { abbr: "OOPSLA", edition: "2027", kind: "논문", date: "2027-03-23", note: "2차 라운드" },
    { abbr: "SC", edition: "2027", kind: "초록", date: "2027-03-25" },
    { abbr: "UIST", edition: "2027", kind: "초록", date: "2027-03-31" },

    /* ---- 2027-04 ---- */
    { abbr: "SC", edition: "2027", kind: "논문", date: "2027-04-01" },
    { abbr: "MM", edition: "2027", kind: "초록", date: "2027-04-03" },
    { abbr: "UIST", edition: "2027", kind: "논문", date: "2027-04-07" },
    { abbr: "FOCS", edition: "2027", kind: "논문", date: "2027-04-08" },
    { abbr: "MICRO", edition: "2027", kind: "초록", date: "2027-04-09" },
    { abbr: "MM", edition: "2027", kind: "논문", date: "2027-04-10" },
    { abbr: "SOSP", edition: "2027", kind: "초록", date: "2027-04-13" },
    { abbr: "ICCAD", edition: "2027", kind: "논문", date: "2027-04-14" },
    { abbr: "CHES", edition: "2027", kind: "논문", date: "2027-04-15", note: "분기 마감" },
    { abbr: "MICRO", edition: "2027", kind: "논문", date: "2027-04-16" },
    { abbr: "SOSP", edition: "2027", kind: "논문", date: "2027-04-17" },
    { abbr: "CoRL", edition: "2027", kind: "논문", date: "2027-04-29" },

    /* ---- 2027-05 ---- */
    { abbr: "UBICOMP", edition: "2027", kind: "논문", date: "2027-05-01", note: "IMWUT 분기 마감" },
    { abbr: "NeurIPS", edition: "2027", kind: "초록", date: "2027-05-11" },
    { abbr: "NeurIPS", edition: "2027", kind: "논문", date: "2027-05-15" },
    { abbr: "SIGGRAPH ASIA", edition: "2027", kind: "논문", date: "2027-05-18" },
    { abbr: "EMNLP", edition: "2027", kind: "논문", date: "2027-05-19", note: "ARR 마감" },
    { abbr: "CIKM", edition: "2027", kind: "논문", date: "2027-05-20" },
    { abbr: "RTSS", edition: "2027", kind: "논문", date: "2027-05-27" },

    /* ---- 2027-06 ---- */
    { abbr: "ASE", edition: "2027", kind: "논문", date: "2027-06-04" },
    { abbr: "ICDM", edition: "2027", kind: "논문", date: "2027-06-11" }
  ]
};
