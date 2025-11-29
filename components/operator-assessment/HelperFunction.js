function calculateResults(data) {
  const processesWithCalculations = data.processes.map(process => {
    const validCycleTimes = process.cycleTimes.filter(time => time > 0);
    const avgCycleTime = validCycleTimes.length > 0 
      ? validCycleTimes.reduce((a, b) => a + b, 0) / validCycleTimes.length 
      : 0;
    const target = 60 / process.smv
    const capacity = 3600 / avgCycleTime
    const performance = (capacity / target) * 100

    let practicalMarks = 0
    if (performance > 90) practicalMarks = 100
    else if (performance >= 80) practicalMarks = 80
    else if (performance >= 70) practicalMarks = 70
    else if (performance >= 60) practicalMarks = 60
    else if (performance >= 50) practicalMarks = 50

    return {
      ...process,
      avgCycleTime,
      target,
      capacity,
      performance,
      practicalMarks
    }
  })

  // Machine Score Calculation with MULTISKILL logic
  const calculateMachineScore = (processes) => {
    const specialMachines = ["SNLS/DNLS", "Over Lock", "Flat Lock"];
    const semiSpecialMachines = ["F/Sleamer", "Kansai", "FOA"];

    const machinesUsed = [...new Set(processes.map(p => p.machineType))];

    // MULTISKILL CHECK
    const hasAllThreeSpecial = specialMachines.every(machine => 
      machinesUsed.includes(machine)
    );

    if (hasAllThreeSpecial) {
      return 100;
    }

    // Special Machine Score
    const specialCount = machinesUsed.filter(m => specialMachines.includes(m)).length;

    let specialScore = 0;
    if (specialCount === 1) specialScore =  55;
    else if (specialCount === 2) specialScore = 80;
    else if (specialCount === 3) specialScore = 100;

    let totalScore = specialScore;

    // Semi-Special Score
    if (totalScore < 100) {
      const semiCount = machinesUsed.filter(m => semiSpecialMachines.includes(m)).length;
      totalScore += semiCount * 20;
    }

    // Other Machines Score
    if (totalScore < 100) {
      const otherMachines = machinesUsed.filter(
        m => !specialMachines.includes(m) && !semiSpecialMachines.includes(m)
      );

      totalScore += otherMachines.length * 10;
    }

    return Math.min(totalScore, 100);
  };

  const machineScore = calculateMachineScore(data.processes);
  const finalMachineScore = machineScore * 0.3;

  // DOP Score Calculation
  const dopScores = processesWithCalculations.map(process => {
    const dopPoints = {
      'Basic': 30,
      'Semi Critical': 50,
      'Critical': 100
    }
    return dopPoints[process.dop] || 0
  })

  const dopScoreCalculate = dopScores.length > 0 ? 
    Math.min(dopScores.reduce((sum, score) => sum + score, 0) / dopScores.length) : 0
  const dopScore = dopScoreCalculate * 0.20

  // Practical Score Calculation
  const totalPractical = processesWithCalculations.reduce(
    (sum, process) => sum + process.practicalMarks,
    0
  )
  const practicalCount = processesWithCalculations.length
  const practicalScore = practicalCount > 0 ? 
    (totalPractical / practicalCount) * 0.30 : 0

  // Quality Score Calculation
  const qualityScoreData = processesWithCalculations.reduce((acc, process) => {
    const qualityPoints = {
      'No Defect': 100,
      '1 Operation Defect': 80,
      '2 Operation Defect': 60,
      '3 Operation Defect': 40,
      '4 Operation Defect': 20,
      '5 Operation Defect': 0,
    }
    
    acc.totalScore += qualityPoints[process.qualityStatus] || 0
    acc.count += 1
    return acc
  }, { totalScore: 0, count: 0 })

  const averageQualityScoreCalculate = qualityScoreData.count > 0 ? 
    qualityScoreData.totalScore / qualityScoreData.count : 0
  const averageQualityScore = averageQualityScoreCalculate * 0.1

  // Education Score Calculation
  const educationScoreMap = {
    'Eight Above': 100,
    'Five Above': 50,
    'Below Five': 30
  }
  const educationScoreCalculate = educationScoreMap[data.educationalStatus] || 0
  const educationScore = educationScoreCalculate * 0.05

  // Attitude Score Calculation
  const attitudeScoreMap = {
    'Good': 100,
    'Normal': 50,
    'Bad': 30
  }
  const attitudeScoreCalculate = attitudeScoreMap[data.attitude] || 0
  const attitudeScore = attitudeScoreCalculate * 0.05

  // Total Score Calculation
  const totalScore = finalMachineScore + dopScore + practicalScore + averageQualityScore + educationScore + attitudeScore

  // Special process grade adjustment logic
  const applySpecialProcessRules = (processes, calculatedGrade, calculatedLevel, calculatedDesignation) => {
    let finalGrade = calculatedGrade;
    let finalLevel = calculatedLevel;
    let finalDesignation = calculatedDesignation;

    const fourProcess = [
        { name: "Pocket join (Kangaro)", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Placket box", minCapacity: 90, machine: "SNLS/DNLS" },
        { name: "Zipper join(2nd)", minCapacity: 60, machine: "SNLS/DNLS" },
        { name: "Back neck tape top stitch insert label", minCapacity: 120, machine: "SNLS/DNLS" }
    ];

    const hasFourProcess = fourProcess.every(req => {
      const foundProcess = processes.find(p => {
        const processNameMatch = p.processName.toLowerCase().includes(req.name.toLowerCase().split(' ')[0]);
        const capacityMatch = Math.round(p.capacity) >= req.minCapacity;
        const machineMatch = p.machineType === "SNLS" || p.machineType === "DNLS" || p.machineType === "SNLS/DNLS";
        
        return processNameMatch && capacityMatch && machineMatch;
      });
      
      return !!foundProcess;
    });

    const hasMachineProcess = (machine, processName, minCapacity = 0) => {
      return processes.some(p => {
        const machineMatch = p.machineType === machine || 
                           (machine === "SNLS/DNLS" && (p.machineType === "SNLS" || p.machineType === "DNLS"));
        const processMatch = p.processName.toLowerCase().includes(processName.toLowerCase());
        const capacityMatch = Math.round(p.capacity) >= minCapacity;
        return machineMatch && processMatch && capacityMatch;
      });
    };

    const hasNeckJoinOverLock = hasMachineProcess("Over Lock", "Neck join", 150);
    const hasBodyHemFlatLock = hasMachineProcess("Flat Lock", "Bottom hem", 220);

    if (hasFourProcess && hasNeckJoinOverLock && hasBodyHemFlatLock) {
        finalLevel = 'Multiskill';
        finalGrade = 'A++';
        finalDesignation = 'Jr.Operator';
    } 
    else if (hasNeckJoinOverLock && hasBodyHemFlatLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    } 
    else if (hasFourProcess && hasBodyHemFlatLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    } 
    else if (hasFourProcess && hasNeckJoinOverLock) {
        finalGrade = 'A++';
        finalLevel = 'Excellent';
        finalDesignation = 'Jr.Operator';
    } else if (hasFourProcess) {
        finalGrade = 'A+';
        finalLevel = 'Very Good';
        finalDesignation = 'Jr.Operator';
    }

    // Capacity-based rules
    processes.forEach(process => {
        const capacity = Math.round(process.capacity);

        if (process.processName === "Neck join" && process.smv === 0.35 && finalGrade !== 'A++') {
            if (capacity >= 150 && finalGrade !== 'A+') {
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 120 && capacity <= 149 && !['A++', 'A+'].includes(finalGrade)) {
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 100 && capacity <= 119 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
        
        else if (process.processName === "Bottom hem" && process.smv === 0.23 && finalGrade !== 'A++') {
            if (capacity >= 220 && finalGrade !== 'A+') {
                finalGrade = 'A+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Very Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 200 && capacity <= 219 && !['A++', 'A+'].includes(finalGrade)) {
                finalGrade = 'A';
                if (finalLevel !== 'Multiskill') finalLevel = 'Good';
                finalDesignation = 'Jr.Operator';
            } else if (capacity >= 180 && capacity <= 199 && !['A++', 'A+', 'A'].includes(finalGrade)) {
                finalGrade = 'B+';
                if (finalLevel !== 'Multiskill') finalLevel = 'Medium';
                finalDesignation = 'Jr.Operator';
            }
        }
    });

    return { finalGrade, finalLevel, finalDesignation };
  };

  // Calculate initial grade
  let grade, level, designation;
  
  if (averageQualityScore < 5) {
    grade = 'Unskill'; 
    level = 'Unskill'; 
    designation = 'Asst.Operator';
  } else {
    // Initial assessment based on total score
    if (totalScore >= 90) {
      grade = 'A++'; level = 'Excellent'; designation = 'Jr.Operator';
    } else if (totalScore >= 80) {
      grade = 'A+'; level = 'Better'; designation = 'Jr.Operator';
    } else if (totalScore >= 75) {
      grade = 'A'; level = 'Good'; designation = 'Jr.Operator';
    } else if (totalScore >= 60) {
      grade = 'B+'; level = 'Medium'; designation = 'Jr.Operator';
    } else if (totalScore >= 50) {
      grade = 'B'; level = 'Average'; designation = 'Gen.Operator';
    } else {
      grade = 'Unskill'; level = 'Unskill'; designation = 'Asst.Operator';
    }

    // Apply special process rules if operator got lower grade
    const adjustedAssessment = applySpecialProcessRules(
      processesWithCalculations, 
      grade, 
      level, 
      designation
    );
    
    grade = adjustedAssessment.finalGrade;
    level = adjustedAssessment.finalLevel;
    designation = adjustedAssessment.finalDesignation;
  }

  return {
    processes: processesWithCalculations,
    scores: {
      machineScore: finalMachineScore,
      dopScore,
      practicalScore,
      averageQualityScore,
      educationScore,
      attitudeScore,
      totalScore
    },
    finalAssessment: {
      grade,
      level,
      designation
    }
  }
}