// FUNÇÃO ESPECÍFICA PARA ANÁLISE ACADÊMICA
async function analyzeAcademicText(text, studentLevel) {
    // NÍVEIS: 'undergrad', 'masters', 'doctoral', 'researcher'
    
    const levelExpectations = {
        undergrad: {
            maxCitationDensity: 3, // citações por 1000 palavras
            expectedComplexity: 40,
            personalVoiceWeight: 0.8
        },
        masters: {
            maxCitationDensity: 5,
            expectedComplexity: 60,
            personalVoiceWeight: 0.6
        },
        doctoral: {
            maxCitationDensity: 8,
            expectedComplexity: 80,
            personalVoiceWeight: 0.4
        }
    };
    
    const expectations = levelExpectations[studentLevel] || levelExpectards.undergrad;
    
    // ANÁLISE DE DENSIDADE DE CITAÇÕES
    const citationDensity = calculateCitationDensity(text);
    const citationScore = Math.max(0, (citationDensity - expectations.maxCitationDensity) * 10);
    
    // ANÁLISE DE VOZ PESSOAL
    const personalVoiceScore = analyzePersonalVoice(text) * expectations.personalVoiceWeight;
    
    // ANÁLISE DE COMPLEXIDADE vs. EXPECTATIVA
    const complexityScore = calculateComplexity(text);
    const complexityDeviation = Math.abs(complexityScore - expectations.expectedComplexity);
    
    // DETECÇÃO DE PADRÕES DE IA ACADÊMICA
    const aiPatternScore = detectAcademicAIPatterns(text);
    
    // CÁLCULO FINAL PARA CONTEXTO ACADÊMICO
    let humanProbability = 70; // Base mais alta para dar benefício da dúvida
    
    // PENALIDADES FORTES
    humanProbability -= citationScore; // Muitas citações
    humanProbability -= (aiPatternScore * 1.2); // Padrões de IA
    humanProbability -= (complexityDeviation * 0.5); // Complexidade incompatível
    
    // BÔNUS FORTES
    humanProbability += (personalVoiceScore * 1.5); // Voz pessoal
    
    // DETECTOR DE "PERFEIÇÃO SUSPEITA"
    const perfectionScore = calculatePerfectionScore(text);
    humanProbability -= (perfectionScore * 0.8);
    
    return Math.max(10, Math.min(95, humanProbability));
}

// FUNÇÃO: Calcular densidade de citações
function calculateCitationDensity(text) {
    const words = text.split(/\s+/).length;
    const citations = (text.match(/\([A-ZÀ-ÿ][^)]*\d{4}[^)]*\)/g) || []).length;
    return (citations / (words / 1000)); // citações por 1000 palavras
}

// FUNÇÃO: Analisar voz pessoal
function analyzePersonalVoice(text) {
    let score = 0;
    
    // Expressões de primeira pessoa
    const firstPerson = (text.match(/\b(?:eu|nós|minha|nossa|meu|nosso)\b/gi) || []).length;
    score += Math.min(firstPerson * 3, 30);
    
    // Experiências pessoais
    const personalExp = (text.match(/\b(?:experiência|prática|observação|pesquisa|estudo)\s+(?:pessoal|própria|realizada)/gi) || []).length;
    score += personalExp * 8;
    
    // Dúvidas e reflexões
    const reflections = (text.match(/\b(?:questiono|pergunto|refiro|parece-me|ao meu ver)\b/gi) || []).length;
    score += reflections * 5;
    
    return Math.min(score, 100);
}

// FUNÇÃO: Calcular "perfeição suspeita"
function calculatePerfectionScore(text) {
    let score = 0;
    
    // 1. Estrutura perfeita demais
    const sections = text.split(/\n\s*\n/);
    if (sections.length >= 5) {
        const headingPattern = /^(?:[0-9]+\.\s+|[A-Z][A-Z\s]{5,})/gm;
        const headings = text.match(headingPattern) || [];
        if (headings.length / sections.length > 0.7) {
            score += 20; // Muitas seções formalmente estruturadas
        }
    }
    
    // 2. Transições perfeitas
    const transitions = text.match(/\b(?:portanto|assim|logo|pois|contudo|entretanto|no entanto)\b/gi) || [];
    if (transitions.length > (text.length / 500)) { // Mais de 1 transição a cada 500 chars
        score += 15;
    }
    
    // 3. Vocabulário consistentemente complexo
    const complexWords = text.match(/\b[a-zA-ZÀ-ÿ]{10,}\b/g) || [];
    const totalWords = text.split(/\s+/).length;
    if (complexWords.length / totalWords > 0.15) { // Mais de 15% palavras complexas
        score += 25;
    }
    
    return score;
}
