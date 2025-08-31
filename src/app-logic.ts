// Module for text analysis logic
export let data = {
  paragraphs: 0,
  sentences: 0,
  words: 0,
  hardSentences: 0,
  veryHardSentences: 0,
  adverbs: 0,
  passiveVoice: 0,
  complex: 0
};

export function resetData() {
  data = {
    paragraphs: 0,
    sentences: 0,
    words: 0,
    hardSentences: 0,
    veryHardSentences: 0,
    adverbs: 0,
    passiveVoice: 0,
    complex: 0
  };
}

export function analyzeText(text: string) {
  resetData();
  const paragraphs = text.split("\n");
  data.paragraphs = paragraphs.length;
  paragraphs.forEach(p => {
    if (p.trim() !== '') {
      getDifficultSentences(p);
    }
  });
  return data;
}

export function getCounters() {
  return {
    adverb: `You have used ${data.adverbs} adverb${data.adverbs > 1 ? "s" : ""}. Try to use ${Math.round(data.paragraphs / 3)} or less`,
    passive: `You have used passive voice ${data.passiveVoice} time${data.passiveVoice > 1 ? "s" : ""}. Aim for ${Math.round(data.sentences / 5)} or less.`,
    complex: `${data.complex} phrase${data.complex > 1 ? "s" : ""} could be simplified.`,
    hardSentence: `${data.hardSentences} of ${data.sentences} sentence${data.sentences > 1 ? "s are" : " is"} hard to read`,
    veryHardSentence: `${data.veryHardSentences} of ${data.sentences} sentence${data.sentences > 1 ? "s are" : " is"} very hard to read`
  };
}

export function getDifficultSentences(p: string): string {
  // Split on sentence endings and capture the punctuation
  let parts = p.split(/([.!?]+)/);
  let sentences: string[] = [];
  let currentSentence = "";

  for (let i = 0; i < parts.length; i++) {
    currentSentence += parts[i];
    if (i % 2 === 1) { // This is punctuation
      sentences.push(currentSentence.trim());
      currentSentence = "";
    }
  }

  // Handle any remaining content
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  data.sentences += sentences.length;

  let processedParts: string[] = [];
  let sentenceIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0 && parts[i].trim()) { // This is sentence content
      let sent = parts[i].trim();
      let punctuation = parts[i + 1] || "";

      let cleanSentence = sent.replace(/[^a-z0-9. ]/gi, "") + ".";
      let words = cleanSentence.split(" ").length;
      let letters = cleanSentence.split(" ").join("").length;

      data.words += words;
      sent = getAdverbs(sent);
      sent = getComplex(sent);
      sent = getPassive(sent);
      sent = getQualifier(sent);

      let level = calculateLevel(letters, words, 1);

      if (words >= 14) {
        if (level >= 10 && level < 14) {
          data.hardSentences += 1;
          processedParts.push(`<span class="hardSentence">${sent}${punctuation}</span>`);
        } else if (level >= 14) {
          data.veryHardSentences += 1;
          processedParts.push(`<span class="veryHardSentence">${sent}${punctuation}</span>`);
        } else {
          processedParts.push(sent + punctuation);
        }
      } else {
        processedParts.push(sent + punctuation);
      }

      i++; // Skip the punctuation we already processed
    } else if (parts[i]) {
      processedParts.push(parts[i]);
    }
  }

  return processedParts.join("");
}

export function getPassive(sent: string): string {
  let originalWords = sent.split(" ");
  let words = sent
    .replace(/[^a-z0-9. ]/gi, "")
    .toLowerCase()
    .split(" ");
  let ed = words.filter(word => word.match(/ed$/));
  if (ed.length > 0) {
    ed.forEach(match => {
      originalWords = checkPrewords(words, originalWords, match);
    });
  }
  return originalWords.join(" ");
}

export function checkPrewords(words: string[], originalWords: string[], match: string): string[] {
  let preWords = ["is", "are", "was", "were", "be", "been", "being"];
  let index = words.indexOf(match);
  if (index >= 0 && preWords.indexOf(words[index - 1]) >= 0) {
    data.passiveVoice += 1;
    originalWords[index - 1] =
      '<span class="passive">' + originalWords[index - 1];
    originalWords[index] = originalWords[index] + "</span>";
    return originalWords;
  } else {
    return originalWords;
  }
}

export function getSentenceFromParagraph(p: string): string[] {
  // More robust sentence splitting that handles various punctuation
  let sentences = p
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences;
}

export function calculateLevel(letters: number, words: number, sentences: number): number {
  if (words === 0 || sentences === 0) {
    return 0;
  }
  let level = Math.round(
    4.71 * (letters / words) + 0.5 * words / sentences - 21.43
  );
  return level <= 0 ? 0 : level;
}

export function getAdverbs(sentence: string): string {
  let lyWords = getLyWords();
  let commonAdverbs = getCommonAdverbs();

  return sentence
    .split(" ")
    .map(word => {
      let cleanWord = word.replace(/[^a-z0-9. ]/gi, "").toLowerCase();

      // Check for -ly adverbs (excluding those in lyWords list)
      if (
        cleanWord.match(/ly$/) &&
        lyWords[cleanWord] === undefined
      ) {
        data.adverbs += 1;
        return `<span class="adverb">${word}</span>`;
      }

      // Check for common adverbs that don't end in -ly
      if (commonAdverbs[cleanWord]) {
        data.adverbs += 1;
        return `<span class="adverb">${word}</span>`;
      }

      return word;
    })
    .join(" ");
}

export function getComplex(sentence: string): string {
  let words = getComplexWords();
  let wordList = Object.keys(words);
  wordList.forEach(key => {
    sentence = findAndSpan(sentence, key, "complex");
  });
  return sentence;
}

export function findAndSpan(sentence: string, string: string, type: string): string {
  let index = sentence.toLowerCase().indexOf(string);
  if (index >= 0) {
    if (type === "complex") {
      data.complex += 1;
    } else if (type === "qualifier") {
      data.adverbs += 1;
    }
    sentence =
      sentence.slice(0, index) +
      `<span class="${type}">` +
      sentence.slice(index, index + string.length) +
      "</span>" +
      findAndSpan(sentence.slice(index + string.length), string, type);
  }
  return sentence;
}

export function getQualifier(sentence: string): string {
  let qualifiers = getQualifyingWords();
  let wordList = Object.keys(qualifiers);
  wordList.forEach(key => {
    sentence = findAndSpan(sentence, key, "qualifier");
  });
  return sentence;
}

export function getQualifyingWords(): Record<string, number> {
  return {
    "i believe": 1,
    "i consider": 1,
    "i don't believe": 1,
    "i don't consider": 1,
    "i don't feel": 1,
    "i don't suggest": 1,
    "i don't think": 1,
    "i feel": 1,
    "i hope to": 1,
    "i might": 1,
    "i suggest": 1,
    "i think": 1,
    "i was wondering": 1,
    "i will try": 1,
    "i wonder": 1,
    "in my opinion": 1,
    "is kind of": 1,
    "is sort of": 1,
    just: 1,
    maybe: 1,
    perhaps: 1,
    possibly: 1,
    "we believe": 1,
    "we consider": 1,
    "we don't believe": 1,
    "we don't consider": 1,
    "we don't feel": 1,
    "we don't suggest": 1,
    "we don't think": 1,
    "we feel": 1,
    "we hope to": 1,
    "we might": 1,
    "we suggest": 1,
    "we think": 1,
    "we were wondering": 1,
    "we will try": 1,
    "we wonder": 1
  };
}

export function getCommonAdverbs(): Record<string, number> {
  return {
    far: 1,
    also: 1,
    really: 1,
    very: 1,
    too: 1,
    so: 1,
    just: 1,
    even: 1,
    still: 1,
    almost: 1,
    always: 1,
    never: 1,
    often: 1,
    sometimes: 1,
    usually: 1,
    now: 1,
    then: 1,
    here: 1,
    there: 1,
    well: 1,
    quite: 1,
    rather: 1,
    enough: 1,
    indeed: 1,
    perhaps: 1,
    maybe: 1,
    certainly: 1,
    surely: 1,
    definitely: 1,
    absolutely: 1,
    completely: 1,
    totally: 1,
    entirely: 1,
    fully: 1,
    partly: 1,
    hardly: 1,
    barely: 1,
    scarcely: 1,
    nearly: 1,
    practically: 1,
    virtually: 1,
    actually: 1,
    truly: 1,
    obviously: 1,
    clearly: 1,
    apparently: 1,
    evidently: 1,
    seemingly: 1,
    probably: 1,
    possibly: 1,
    consequently: 1,
    therefore: 1,
    thus: 1,
    hence: 1,
    accordingly: 1,
    moreover: 1,
    furthermore: 1,
    additionally: 1,
    besides: 1,
    likewise: 1,
    similarly: 1,
    conversely: 1,
    however: 1,
    nevertheless: 1,
    nonetheless: 1,
    yet: 1,
    instead: 1,
    otherwise: 1,
    everywhere: 1,
    anywhere: 1,
    nowhere: 1,
    somewhere: 1,
    elsewhere: 1,
    near: 1,
    close: 1,
    away: 1,
    back: 1,
    forward: 1,
    ahead: 1,
    behind: 1,
    above: 1,
    below: 1,
    over: 1,
    under: 1,
    across: 1,
    through: 1,
    around: 1,
    about: 1,
    along: 1,
    beside: 1,
    between: 1,
    among: 1,
    within: 1,
    without: 1,
    inside: 1,
    outside: 1,
    before: 1,
    after: 1,
    during: 1,
    since: 1,
    until: 1,
    while: 1,
    when: 1,
    where: 1,
    why: 1,
    how: 1,
    ever: 1,
    seldom: 1,
    rarely: 1,
    frequently: 1,
    occasionally: 1,
    generally: 1,
    normally: 1,
    typically: 1,
    commonly: 1,
    mainly: 1,
    mostly: 1,
    largely: 1,
    primarily: 1,
    chiefly: 1,
    especially: 1,
    particularly: 1,
    specifically: 1,
    notably: 1,
    remarkably: 1,
    significantly: 1,
    considerably: 1,
    substantially: 1,
    greatly: 1,
    highly: 1,
    extremely: 1,
    fairly: 1,
    pretty: 1,
    somewhat: 1,
    slightly: 1,
    moderately: 1,
    reasonably: 1,
    sufficiently: 1,
    adequately: 1,
    merely: 1,
    simply: 1,
    purely: 1,
    solely: 1,
    exclusively: 1,
    altogether: 1,
    utterly: 1,
    perfectly: 1,
    exactly: 1,
    precisely: 1
  };
}

export function getLyWords(): Record<string, number> {
  return {
    actually: 1,
    additionally: 1,
    allegedly: 1,
    ally: 1,
    alternatively: 1,
    anomaly: 1,
    apply: 1,
    approximately: 1,
    ashely: 1,
    ashly: 1,
    assembly: 1,
    awfully: 1,
    baily: 1,
    belly: 1,
    bely: 1,
    billy: 1,
    bradly: 1,
    bristly: 1,
    bubbly: 1,
    bully: 1,
    burly: 1,
    butterfly: 1,
    carly: 1,
    charly: 1,
    chilly: 1,
    comely: 1,
    completely: 1,
    comply: 1,
    consequently: 1,
    costly: 1,
    courtly:1,
    crinkly: 1,
    crumbly: 1,
    cuddly: 1,
    curly: 1,
    currently: 1,
    daily: 1,
    dastardly: 1,
    deadly: 1,
    deathly: 1,
    definitely: 1,
    dilly: 1,
    disorderly: 1,
    doily: 1,
    dolly: 1,
    dragonfly: 1,
    early: 1,
    elderly: 1,
    elly: 1,
    emily: 1,
    especially: 1,
    exactly: 1,
    exclusively: 1,
    family: 1,
    finally: 1,
    firefly: 1,
    folly: 1,
    friendly: 1,
    frilly: 1,
    gadfly: 1,
    gangly: 1,
    generally: 1,
    ghastly: 1,
    giggly: 1,
    globally: 1,
    goodly: 1,
    gravelly: 1,
    grisly: 1,
    gully: 1,
    haily: 1,
    hally: 1,
    harly: 1,
    hardly: 1,
    heavenly: 1,
    hillbilly: 1,
    hilly: 1,
    holly: 1,
    holy: 1,
    homely: 1,
    homily: 1,
    horsefly: 1,
    hourly: 1,
    immediately: 1,
    instinctively: 1,
    imply: 1,
    italy: 1,
    jelly: 1,
    jiggly: 1,
    jilly: 1,
    jolly: 1,
    july: 1,
    karly: 1,
    kelly: 1,
    kindly: 1,
    lately: 1,
    likely: 1,
    lilly: 1,
    lily: 1,
    lively: 1,
    lolly: 1,
    lonely: 1,
    lovely: 1,
    lowly: 1,
    luckily: 1,
    mealy: 1,
    measly: 1,
    melancholy: 1,
    mentally: 1,
    molly: 1,
    monopoly: 1,
    monthly: 1,
    multiply: 1,
    nightly: 1,
    oily: 1,
    only: 1,
    orderly: 1,
    panoply: 1,
    particularly: 1,
    partly: 1,
    paully: 1,
    pearly: 1,
    pebbly: 1,
    polly: 1,
    potbelly: 1,
    presumably: 1,
    previously: 1,
    pualy: 1,
    quarterly: 1,
    rally: 1,
    rarely: 1,
    recently: 1,
    rely: 1,
    reply: 1,
    reportedly: 1,
    roughly: 1,
    sally: 1,
    scaly: 1,
    shapely: 1,
    shelly: 1,
    shirly: 1,
    shortly: 1,
    sickly: 1,
    silly: 1,
    sly: 1,
    smelly: 1,
    sparkly: 1,
    spindly: 1,
    spritely: 1,
    squiggly: 1,
    stately: 1,
    steely: 1,
    supply: 1,
    surly: 1,
    tally: 1,
    timely: 1,
    trolly: 1,
    ugly: 1,
    underbelly: 1,
    unfortunately: 1,
    unholy: 1,
    unlikely: 1,
    usually: 1,
    waverly: 1,
    weekly: 1,
    wholly: 1,
    willy: 1,
    wily: 1,
    wobbly: 1,
    wooly: 1,
    worldly: 1,
    wrinkly: 1,
    yearly: 1
  };
}

export function getComplexWords(): Record<string, string[]> {
  return {
    "a number of": ["many", "some"],
    abundance: ["enough", "plenty"],
    "accede to": ["allow", "agree to"],
    accelerate: ["speed up"],
    accentuate: ["stress"],
    accompany: ["go with", "with"],
    accomplish: ["do"],
    accorded: ["given"],
    accrue: ["add", "gain"],
    acquiesce: ["agree"],
    acquire: ["get"],
    additional: ["more", "extra"],
    "adjacent to": ["next to"],
    adjustment: ["change"],
    admissible: ["allowed", "accepted"],
    advantageous: ["helpful"],
    "adversely impact": ["hurt"],
    advise: ["tell"],
    aforementioned: ["remove"],
    aggregate: ["total", "add"],
    aircraft: ["plane"],
    "all of": ["all"],
    alleviate: ["ease", "reduce"],
    allocate: ["divide"],
    "along the lines of": ["like", "as in"],
    "already existing": ["existing"],
    alternatively: ["or"],
    ameliorate: ["improve", "help"],
    anticipate: ["expect"],
    apparent: ["clear", "plain"],
    appreciable: ["many"],
    "as a means of": ["to"],
    "as of yet": ["yet"],
    "as to": ["on", "about"],
    "as yet": ["yet"],
    ascertain: ["find out", "learn"],
    assistance: ["help"],
    "at this time": ["now"],
    attain: ["meet"],
    "attributable to": ["because"],
    authorize: ["allow", "let"],
    "because of the fact that": ["because"],
    belated: ["late"],
    "benefit from": ["enjoy"],
    bestow: ["give", "award"],
    "by virtue of": ["by", "under"],
    cease: ["stop"],
    "close proximity": ["near"],
    commence: ["begin or start"],
    "comply with": ["follow"],
    concerning: ["about", "on"],
    consequently: ["so"],
    consolidate: ["join", "merge"],
    constitutes: ["is", "forms", "makes up"],
    demonstrate: ["prove", "show"],
    depart: ["leave", "go"],
    designate: ["choose", "name"],
    discontinue: ["drop", "stop"],
    "due to the fact that": ["because", "since"],
    "each and every": ["each"],
    economical: ["cheap"],
    eliminate: ["cut", "drop", "end"],
    elucidate: ["explain"],
    employ: ["use"],
    endeavor: ["try"],
    enumerate: ["count"],
    equitable: ["fair"],
    equivalent: ["equal"],
    evaluate: ["test", "check"],
    evidenced: ["showed"],
    exclusively: ["only"],
    expedite: ["hurry"],
    expend: ["spend"],
    expiration: ["end"],
    facilitate: ["ease", "help"],
    "factual evidence": ["facts", "evidence"],
    feasible: ["workable"],
    finalize: ["complete", "finish"],
    "first and foremost": ["first"],
    "for the purpose of": ["to"],
    forfeit: ["lose", "give up"],
    formulate: ["plan"],
    "honest truth": ["truth"],
    however: ["but", "yet"],
    "if and when": ["if", "when"],
    impacted: ["affected", "harmed", "changed"],
    implement: ["install", "put in place", "tool"],
    "in a timely manner": ["on time"],
    "in accordance with": ["by", "under"],
    "in addition": ["also", "besides", "too"],
    "in all likelihood": ["probably"],
    "in an effort to": ["to"],
    "in between": ["between"],
    "in excess of": ["more than"],
    "in lieu of": ["instead"],
    "in light of the fact that": ["because"],
    "in many cases": ["often"],
    "in order to": ["to"],
    "in regard to": ["about", "concerning", "on"],
    "in some instances ": ["sometimes"],
    "in terms of": ["omit"],
    "in the near future": ["soon"],
    "in the process of": ["omit"],
    inception: ["start"],
    "incumbent upon": ["must"],
    indicate: ["say", "state", "or show"],
    indication: ["sign"],
    initiate: ["start"],
    "is applicable to": ["applies to"],
    "is authorized to": ["may"],
    "is responsible for": ["handles"],
    "it is essential": ["must", "need to"],
    literally: ["omit"],
    magnitude: ["size"],
    maximum: ["greatest", "largest", "most"],
    methodology: ["method"],
    minimize: ["cut"],
    minimum: ["least", "smallest", "small"],
    modify: ["change"],
    monitor: ["check", "watch", "track"],
    multiple: ["many"],
    necessitate: ["cause", "need"],
    nevertheless: ["still", "besides", "even so"],
    "not certain": ["uncertain"],
    "not many": ["few"],
    "not often": ["rarely"],
    "not unless": ["only if"],
    "not unlike": ["similar", "alike"],
    notwithstanding: ["in spite of", "still"],
    "null and void": ["use either null or void"],
    numerous: ["many"],
    objective: ["aim", "goal"],
    obligate: ["bind", "compel"],
    obtain: ["get"],
    "on the contrary": ["but", "so"],
    "on the other hand": ["omit", "but", "so"],
    "one particular": ["one"],
    optimum: ["best", "greatest", "most"],
    overall: ["omit"],
    "owing to the fact that": ["because", "since"],
    participate: ["take part"],
    particulars: ["details"],
    "pass away": ["die"],
    "pertaining to": ["about", "of", "on"],
    "point in time": ["time", "point", "moment", "now"],
    portion: ["part"],
    possess: ["have", "own"],
    preclude: ["prevent"],
    previously: ["before"],
    "prior to": ["before"],
    prioritize: ["rank", "focus on"],
    procure: ["buy", "get"],
    proficiency: ["skill"],
    "provided that": ["if"],
    purchase: ["buy", "sale"],
    "put simply": ["omit"],
    "readily apparent": ["clear"],
    "refer back": ["refer"],
    regarding: ["about", "of", "on"],
    relocate: ["move"],
    remainder: ["rest"],
    remuneration: ["payment"],
    require: ["must", "need"],
    requirement: ["need", "rule"],
    reside: ["live"],
    residence: ["house"],
    retain: ["keep"],
    satisfy: ["meet", "please"],
    shall: ["must", "will"],
    "should you wish": ["if you want"],
    "similar to": ["like"],
    solicit: ["ask for", "request"],
    "span across": ["span", "cross"],
    strategize: ["plan"],
    subsequent: ["later", "next", "after", "then"],
    substantial: ["large", "much"],
    "successfully complete": ["complete", "pass"],
    sufficient: ["enough"],
    terminate: ["end", "stop"],
    "the month of": ["omit"],
    therefore: ["thus", "so"],
    "this day and age": ["today"],
    "time period": ["time", "period"],
    "took advantage of": ["preyed on"],
    transmit: ["send"],
    transpire: ["happen"],
    "until such time as": ["until"],
    utilization: ["use"],
    utilize: ["use"],
    validate: ["confirm"],
    "various different": ["various", "different"],
    "whether or not": ["whether"],
    "with respect to": ["on", "about"],
    "with the exception of": ["except for"],
    witnessed: ["saw", "seen"]
  };
}
