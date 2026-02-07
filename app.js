const CAP = 140;
const BASE = 100;
const CAP_BP = 14000;
const BASE_BP = 10000;
const BT_SPEC_RATE = 0.26 / 699;
const BT_BASE_BUFF = 20;

const LEVELS = {
  1: { baseRate: 0.05, excessRate: 0.15, flatBonus: 4, maxEvo: 12 },
  2: { baseRate: 0.1, excessRate: 0.3, flatBonus: 8, maxEvo: 24 },
};

const levelInputs = document.querySelectorAll("input[name='level']");
const classSelect = document.getElementById("classSelect");
const classSections = document.querySelectorAll(".class-section");
const specInput = document.getElementById("spec");
const sheetAsInput = document.getElementById("sheetAs");
const sheetMsInput = document.getElementById("sheetMs");
const feastInput = document.getElementById("feast");
const supportToggle = document.getElementById("support");
const wineInputs = document.querySelectorAll("input[name='wine']");

const totalEvoEl = document.getElementById("totalEvo");
const totalCapEl = document.getElementById("totalCap");
const baseEvoEl = document.getElementById("baseEvo");
const flatEvoEl = document.getElementById("flatEvo");
const excessEvoEl = document.getElementById("excessEvo");
const progressBarEl = document.getElementById("progressBar");
const progressTextEl = document.getElementById("progressText");
const computedSpeedsEl = document.getElementById("computedSpeeds");
const overcapTotalEl = document.getElementById("overcapTotal");
const overcapBreakdownEl = document.getElementById("overcapBreakdown");
const neededExcessEl = document.getElementById("neededExcess");
const calloutsEl = document.getElementById("callouts");
const bpFullEl = document.getElementById("bpFull");
const bpFeastEl = document.getElementById("bpFeast");
const bpNoneEl = document.getElementById("bpNone");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const floor2 = (value) => Math.floor(value * 100) / 100;
const toBP = (value) => Math.floor(value * 100 + 1e-6);

const readNumber = (value) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(parsed, 0);
};


const fmt = (value) => {
  if (!Number.isFinite(value)) return "0.00";
  return floor2(value).toFixed(2);
};

const fmtInt = (value) => {
  if (!Number.isFinite(value)) return "0";
  return Math.floor(value).toString();
};

const getLevel = () => {
  const selected = document.querySelector("input[name='level']:checked");
  const level = selected ? Number(selected.value) : 2;
  return LEVELS[level] ? level : 2;
};

const getWineChoice = () => {
  const selected = document.querySelector("input[name='wine']:checked");
  return selected ? selected.value : "none";
};

const getClassChoice = () => {
  return classSelect ? classSelect.value : "berserker-bt";
};

const updateClassVisibility = () => {
  const classChoice = getClassChoice();
  classSections.forEach((section) => {
    const isMatch = section.dataset.class === classChoice;
    section.classList.toggle("is-hidden", !isMatch);
    section.hidden = !isMatch;
  });
};

const getClassBaseBonus = () => {
  const classChoice = getClassChoice();
  const bonuses = { as: 0, ms: 0 };

  if (classChoice === "berserker-bt") {
    const btBonus = calcBtBonus();
    bonuses.as += btBonus;
    bonuses.ms += btBonus;
  }

  if (classChoice === "slayer") {
    bonuses.as += 20;
    bonuses.ms += 20;
  }

  if (classChoice === "berserker-mayhem") {
    bonuses.as += 15;
    bonuses.ms += 15;
  }

  if (classChoice === "aeromancer") {
    bonuses.as += 12;
    bonuses.ms += 12;
  }

  if (classChoice === "guardianknight") {
    bonuses.as += 15;
  }

  if (classChoice === "wardancer") {
    bonuses.as += 20.8;
    bonuses.ms += 16;
  }

  if (classChoice === "machinist") {
    bonuses.as += 15;
    bonuses.ms += 30;
  }

  if (classChoice === "machinist-bladesuit") {
    bonuses.as += 35;
    bonuses.ms += 30;
  }

  if (classChoice === "sharpshooter") {
    bonuses.as += 10;
    bonuses.ms += 18;
  }

  return bonuses;
};

const calculateEvo = (atk, move, levelConfig) => {
  const cappedAtk = floor2(Math.min(atk, CAP));
  const cappedMove = floor2(Math.min(move, CAP));
  const bonusAtk = floor2(Math.max(cappedAtk - BASE, 0));
  const bonusMove = floor2(Math.max(cappedMove - BASE, 0));
  const overAtk = floor2(Math.max(atk - CAP, 0));
  const overMove = floor2(Math.max(move - CAP, 0));
  const overTotal = floor2(overAtk + overMove);

  const bonusSum = floor2(bonusAtk + bonusMove);
  const baseEvo = floor2(bonusSum * levelConfig.baseRate);
  const flatEvo = atk >= CAP && move >= CAP ? levelConfig.flatBonus : 0;
  const excessEvo = floor2(overTotal * levelConfig.excessRate);
  const totalRaw = floor2(baseEvo + flatEvo + excessEvo);
  const totalEvo = Math.min(totalRaw, levelConfig.maxEvo);

  return {
    cappedAtk,
    cappedMove,
    bonusAtk,
    bonusMove,
    overAtk,
    overMove,
    overTotal,
    baseEvo,
    flatEvo,
    excessEvo,
    totalEvo,
  };
};

const calcBtBonus = () => {
  const spec = readNumber(specInput.value);
  return (1 + BT_SPEC_RATE * spec) * BT_BASE_BUFF;
};

const computeFromSources = () => {
  const classBonus = getClassBaseBonus();
  const sheetAsValue = clamp(readNumber(sheetAsInput.value), BASE, CAP);
  const sheetMsValue = clamp(readNumber(sheetMsInput.value), BASE, CAP);
  const sheetAsBonus = sheetAsValue - BASE;
  const sheetMsBonus = sheetMsValue - BASE;
  const feast = clamp(readNumber(feastInput.value), 0, 5);
  const support = supportToggle.checked ? 9 : 0;
  const wineChoice = getWineChoice();
  const wineAtk = wineChoice === "atk" ? 3 : 0;
  const wineMove = wineChoice === "move" ? 3 : 0;

  const atkBonus = floor2(
    classBonus.as +
      sheetAsBonus +
      feast +
      support +
      wineAtk
  );
  const moveBonus = floor2(
    classBonus.ms +
      sheetMsBonus +
      feast +
      support +
      wineMove
  );

  return {
    atk: floor2(BASE + atkBonus),
    move: floor2(BASE + moveBonus),
  };
};

const updateCallouts = (messages) => {
  calloutsEl.innerHTML = "";
  messages.forEach((message) => {
    const p = document.createElement("p");
    p.textContent = message;
    calloutsEl.appendChild(p);
  });
};

const update = () => {
  const { atk, move } = computeFromSources();
  const level = getLevel();
  const levelConfig = LEVELS[level];
  const {
    cappedAtk,
    cappedMove,
    overAtk,
    overMove,
    overTotal,
    baseEvo,
    flatEvo,
    excessEvo,
    totalEvo,
  } = calculateEvo(atk, move, levelConfig);

  const baseAtCap = (CAP - BASE) * 2 * levelConfig.baseRate;
  const requiredExcess = Math.max(
    0,
    (levelConfig.maxEvo - levelConfig.flatBonus - baseAtCap) /
      levelConfig.excessRate
  );

  const progress =
    levelConfig.maxEvo === 0
      ? 0
      : Math.min((totalEvo / levelConfig.maxEvo) * 100, 100);
  const remainingOvercap = Math.max(0, requiredExcess - overTotal);

  totalEvoEl.textContent = `${fmt(totalEvo)}%`;
  totalCapEl.textContent = `Max ${levelConfig.maxEvo}%`;
  if (baseEvoEl) {
    baseEvoEl.textContent = `${fmt(baseEvo)}%`;
  }
  if (flatEvoEl) {
    flatEvoEl.textContent = `${fmt(flatEvo)}%`;
  }
  excessEvoEl.textContent = `${fmt(excessEvo)}%`;
  progressBarEl.style.width = `${progress}%`;
  progressTextEl.textContent = `${fmt(totalEvo)}% of ${levelConfig.maxEvo}% cap`;
  computedSpeedsEl.textContent = `AS ${fmt(atk)} / MS ${fmt(move)}`;
  overcapTotalEl.textContent = `${fmt(overTotal)}%`;
  overcapBreakdownEl.textContent = `AS ${fmt(overAtk)} / MS ${fmt(overMove)}`;
  neededExcessEl.textContent = `${fmt(requiredExcess)}%`;

  const messages = [];
  if (atk < CAP || move < CAP) {
    messages.push(`Raise both speeds to ${CAP}% to unlock excess conversion.`);
  }

  if (totalEvo >= levelConfig.maxEvo - 0.001) {
    messages.push("Breakpoint reached. This node is capped.");
  } else if (atk >= CAP && move >= CAP) {
    messages.push(`Short by ${fmt(remainingOvercap)}% combined overcap to max the node.`);
  } else {
    messages.push(
      `After reaching ${CAP}% on both, you need ${fmt(requiredExcess)}% combined overcap to max the node.`
    );
  }

  updateCallouts(messages);
  updateBreakpoints(levelConfig);
};

const getRequiredOvercapBP = (levelConfig) => {
  const baseRatePercent = levelConfig.baseRate * 100;
  const excessRatePercent = levelConfig.excessRate * 100;
  const flatBP = levelConfig.flatBonus * 100;
  const maxBP = levelConfig.maxEvo * 100;
  const baseAtCapBP = Math.floor(
    ((CAP_BP - BASE_BP) * 2 * baseRatePercent) / 100
  );
  const remainingBP = maxBP - flatBP - baseAtCapBP;
  if (remainingBP <= 0) return 0;
  return Math.floor((remainingBP * 100) / excessRatePercent);
};

const findSwiftRequired = (baseAsBonusBP, baseMsBonusBP, requiredOvercapBP) => {
  const maxSwift = 1850;
  for (let swift = 0; swift <= maxSwift; swift += 1) {
    const swiftBonusBP = Math.ceil((swift * 1200) / 699);
    const atkBP = BASE_BP + baseAsBonusBP + swiftBonusBP;
    const moveBP = BASE_BP + baseMsBonusBP + swiftBonusBP;
    if (atkBP < CAP_BP || moveBP < CAP_BP) {
      continue;
    }
    const overTotalBP = (atkBP - CAP_BP) + (moveBP - CAP_BP);
    if (overTotalBP >= requiredOvercapBP) {
      return swift;
    }
  }

  return null;
};

const updateBreakpoints = (levelConfig) => {
  const classChoice = getClassChoice();
  if (classChoice === "berserker-bt") {
    bpFullEl.textContent = "N/A";
    bpFeastEl.textContent = "N/A";
    bpNoneEl.textContent = "N/A";
    return;
  }

  const classBonus = getClassBaseBonus();
  const baseAs = classBonus.as;
  const baseMs = classBonus.ms;
  const requiredOvercapBP = getRequiredOvercapBP(levelConfig);

  const scenarios = {
    full: { support: 9, feast: 5, wine: "best" },
    feast: { support: 9, feast: 5, wine: "none" },
    none: { support: 9, feast: 0, wine: "none" },
  };

  const withWine = [
    { key: "as", as: 3, ms: 0 },
    { key: "ms", as: 0, ms: 3 },
  ];

  const resolveScenario = ({ support, feast, wine }) => {
    const baseAsBonusBP = toBP(baseAs + support + feast);
    const baseMsBonusBP = toBP(baseMs + support + feast);

    if (wine === "none") {
      return {
        swift: findSwiftRequired(baseAsBonusBP, baseMsBonusBP, requiredOvercapBP),
        wine: "none",
      };
    }

    let best = { swift: null, wine: "as" };
    withWine.forEach((choice) => {
      const swift = findSwiftRequired(
        baseAsBonusBP + toBP(choice.as),
        baseMsBonusBP + toBP(choice.ms),
        requiredOvercapBP
      );
      if (swift === null) {
        return;
      }
      if (best.swift === null || swift < best.swift) {
        best = { swift, wine: choice.key };
      }
    });

    return best;
  };

  const full = resolveScenario(scenarios.full);
  const feast = resolveScenario(scenarios.feast);
  const none = resolveScenario(scenarios.none);

  const renderSwift = (value) => (value === null ? "Not reachable" : `${fmtInt(value)} Swift`);

  bpFullEl.textContent = renderSwift(full.swift);
  bpFeastEl.textContent = renderSwift(feast.swift);
  bpNoneEl.textContent = renderSwift(none.swift);

};

const init = () => {
  [
    specInput,
    sheetAsInput,
    sheetMsInput,
    feastInput,
  ].forEach((input) => {
    input.addEventListener("input", update);
  });

  [supportToggle].forEach((input) => {
    input.addEventListener("change", update);
  });

  wineInputs.forEach((input) => {
    input.addEventListener("change", update);
  });

  levelInputs.forEach((input) => {
    input.addEventListener("change", update);
  });

  if (classSelect) {
    classSelect.addEventListener("change", () => {
      updateClassVisibility();
      update();
    });
  }
  updateClassVisibility();
  update();
};

init();
