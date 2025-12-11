// Variável global para armazenar resultados atuais
let currentAnalysisResult = null;

// PADRÕES DE IA REFINADOS - MAIS ESPECÍFICOS
const strongAIPatterns = [
    // Padrões de formatação típicos de IA
    {
        pattern: /^\s*(?:## |\*\*|### |#{1,3}\s)[A-Z][^.!?]{0,80}[.:]\s*$/gm,
        weight: 20,
        description: "Títulos excessivamente padronizados"
    },
    {
        pattern: /\b(?:Em suma|Concluindo|Nesse contexto|Dito isso|Para finalizar|Assim sendo)\b[^.!?]{0,50}(?:portanto|logo|desse modo|dessa forma|consequentemente)\b/gi,
        weight: 25,
        description: "Transições redundantes e previsíveis"
    },
    {
        pattern: /(?:^|\n)\s*(?:Primeiramente|Em primeiro lugar|Inicialmente)[^.!?]{0,80}(?:Em segundo lugar|Ademais|Além disso)[^.!?]{0,80}(?:Por fim|Finalmente)/gmis,
        weight: 30,
        description: "Estrutura de três pontos excessivamente simétrica"
    },
    {
        pattern: /\b(?:Cabe destacar|Vale ressaltar|É importante mencionar|Convém notar)\b[^.!?]{0,60}\b(?:que|o fato de|a importância)\b/gi,
        weight: 18,
        description: "Fórmulas de ênfase repetitivas"
    },
    // Padrões de metalinguagem excessiva
    {
        pattern: /\b(?:este (?:artigo|estudo|trabalho|texto)|a presente (?:pesquisa|análise|investigação))\b[^.!?]{0,100}\b(?:objetiva|tem como propósito|busca|almeja)\b/gi,
        weight: 15,
        description: "Metalinguagem acadêmica genérica"
    },
    // Padrões de citação não natural
    {
        pattern: /"[^"]{20,100}"\s*(?:conforme|segundo|de acordo com)\s*(?:o autor|a autora|os pesquisadores)/gi,
        weight: 12,
        description: "Citações com introduções padronizadas"
    },
    // Auto-identificação como IA (peso muito alto)
    {
        pattern: /\b(?:como um modelo de IA|como uma inteligência artificial|sou um assistente AI|como um algoritmo de linguagem)\b/gi,
        weight: 95,
        description: "Auto-identificação como IA"
    },
    // Notas explícitas de IA
    {
        pattern: /---+\s*\n\*\*Nota (?:do Autor|de IA):\*\*.+?(?:ChatGPT|IA|modelo|gerado|inteligência artificial|OpenAI|GPT).+$/gis,
        weight: 90,
        description: "NOTA EXPLÍCITA DE IA DETECTADA"
    }
];

// PADRÕES HUMANOS APRIMORADOS - PROTEGE ESCRITA ACADÊMICA
const strongHumanPatterns = [
    // Estruturas acadêmicas complexas
    {
        pattern: /\b(?:Não obstante|Todavia|Contudo|Entretanto)\b[^.!?]{30,150}[,;]\s+\b(?:é preciso considerar|convém ponderar|importa analisar)\b/gi,
        weight: 35,
        description: "Contrapontos acadêmicos elaborados"
    },
    {
        pattern: /(?:\([^)]{20,80}\)|\[[^\]]{20,80}\])[^.!?]{10,30}[,;]\s+\b(?:o que|o qual|a qual|os quais|as quais)\b/gi,
        weight: 25,
        description: "Incidentais e relativas complexas"
    },
    // Marcadores de autoria pessoal
    {
        pattern: /\b(?:Sob nossa perspectiva|Do nosso ponto de vista|Em nossa compreensão|Na interpretação que defendemos)\b/gi,
        weight: 40,
        description: "Posicionamento acadêmico explícito"
    },
    {
        pattern: /\b(?:Parece-nos|Afigura-se-nos|Mostra-se-nos|Revela-se-nos)\b/gi,
        weight: 35,
        description: "Construções reflexivas complexas"
    },
    // Marcas de revisão e ajuste
    {
        pattern: /(?:\(sic\)|\[grifo nosso\]|\[itálico do autor\]|\[destaque nosso\]|nota do autor)/gi,
        weight: 20,
        description: "Notas editoriais e de formatação"
    },
    // Expressões de opinião pessoal
    {
        pattern: /\b(?:acreditamos|entendemos|percebemos|observamos|defendemos|questionamos)\b/gi,
        weight: 25,
        description: "Expressões de posicionamento pessoal"
    },
    {
        pattern: /\b(?:parece-me|ao meu ver|na minha opinião|do meu ponto de vista)\b/gi,
        weight: 30,
        description: "Expressões de opinião pessoal explícita"
    },
    // Variação terminológica (penalidade para repetição)
    {
        pattern: /\b(\w+)\b[^.!?]{50,150}\b(\1)\b[^.!?]{30,100}\b(\1)\b/gi,
        weight: -15,
        description: "Repetição excessiva de termos (penalidade)"
    },
    // Expressões coloquiais e explicativas
    {
        pattern: /\b(?:enfim|digamos|por assim dizer|ou seja|isto é)\b/gi,
        weight: 15,
        description: "Expressões coloquiais e explicativas"
    },
    // Pontuação expressiva
    {
        pattern: /[!?]{2,}/g,
        weight: 12,
        description: "Pontuação expressiva"
    },
    // Citações longas integradas naturalmente
    {
        pattern: /"[^"]{50,}"[^.!?]*\./g,
        weight: 20,
        description: "Citações longas integradas naturalmente"
    }
];

// FUNÇÃO: Ajustar pesos por tipo de conteúdo
function adjustWeightsByContentType(contentType, aiScore, humanScore) {
    const adjustments = {
        academic: {
            aiMultiplier: 0.7,    // Mais tolerante com estruturas formais
            humanMultiplier: 1.2,  // Valoriza complexidade acadêmica
            thresholdAdjustment: +10,
            description: "Modo Acadêmico: Tolerante com formalidade, valoriza complexidade"
        },
        technical: {
            aiMultiplier: 0.8,
            humanMultiplier: 1.1,
            thresholdAdjustment: +5,
            description: "Modo Técnico: Moderadamente tolerante"
        },
        creative: {
            aiMultiplier: 1.3,     // Menos tolerante com clichês
            humanMultiplier: 0.9,
            thresholdAdjustment: -5,
            description: "Modo Criativo: Rigoroso com clichês e fórmulas"
        },
        business: {
            aiMultiplier: 1.0,
            humanMultiplier: 1.0,
            thresholdAdjustment: 0,
            description: "Modo Negócios: Análise padrão"
        },
        casual: {
            aiMultiplier: 1.2,
            humanMultiplier: 0.8,
            thresholdAdjustment: -8,
            description: "Modo Casual: Mais rigoroso com padronização"
        }
    };
    
    const adj = adjustments[contentType] || adjustments.academic;
    return {
        aiAdjusted: aiScore * adj.aiMultiplier,
        humanAdjusted: humanScore * adj.humanMultiplier,
        thresholdAdjustment: adj.thresholdAdjustment,
        description: adj.description
    };
}

// FUNÇÃO: Calcular perplexidade (variação lexical)
function calculatePerplexityScore(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length < 3) return { score: 50, details: "Texto muito curto para análise de perplexidade" };
    
    let totalVariation = 0;
    let previousSentenceEnding = '';
    let similarEndings = 0;
    const sentenceMetrics = [];
    
    sentences.forEach((sentence, index) => {
        const words = sentence.toLowerCase().match(/[\wÀ-ÿ]+/g) || [];
        if (words.length < 5) return;
        
        const uniqueWords = new Set(words);
        const lexicalDiversity = (uniqueWords.size / words.length) * 100;
        
        // Penalizar frases com estrutura muito similar no final
        const endingWords = words.slice(-3).join(' ');
        if (endingWords && endingWords === previousSentenceEnding && words.length > 8) {
            similarEndings++;
            totalVariation -= 15;
        }
        
        totalVariation += lexicalDiversity;
        previousSentenceEnding = endingWords;
        
        sentenceMetrics.push({
            index,
            length: words.length,
            diversity: lexicalDiversity,
            ending: endingWords
        });
    });
    
    const avgVariation = sentences.length > 0 ? totalVariation / sentences.length : 50;
    
    return {
        score: Math.max(0, Math.min(100, avgVariation)),
        similarEndings,
        sentenceCount: sentences.length,
        details: similarEndings > 2 ? "Muitas frases com finais similares" : "Boa variação estrutural"
    };
}

// FUNÇÃO: Analisar padrões de conclusão
function analyzeConclusionPatterns(text) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    if (paragraphs.length < 2) return { score: 0, details: "Texto muito curto para análise de conclusão" };
    
    const lastParagraph = paragraphs[paragraphs.length - 1].toLowerCase();
    let aiScore = 0;
    const detectedPatterns = [];
    
    const aiConclusionPatterns = [
        { pattern: /em resumo.*portanto/, weight: 25, desc: "Estrutura 'resumo + portanto'" },
        { pattern: /assim sendo.*conclu(i|í)mos/, weight: 30, desc: "Estrutura 'assim sendo + concluímos'" },
        { pattern: /dito isso.*é possível afirmar/, weight: 20, desc: "Estrutura 'dito isso + afirmar'" },
        { pattern: /finalmente.*podemos ver que/, weight: 22, desc: "Estrutura 'finalmente + podemos ver'" },
        { pattern: /logo.*infere.*se/, weight: 18, desc: "Uso automático de 'logo + infere-se'" }
    ];
    
    aiConclusionPatterns.forEach(patternObj => {
        if (patternObj.pattern.test(lastParagraph)) {
            aiScore += patternObj.weight;
            detectedPatterns.push(patternObj.desc);
        }
    });
    
    return {
        score: Math.min(50, aiScore),
        patterns: detectedPatterns,
        details: detectedPatterns.length > 0 ? 
            `Padrões detectados: ${detectedPatterns.join(', ')}` : 
            "Conclusão sem padrões automáticos evidentes"
    };
}

// FUNÇÃO: Validação cruzada de análise
function crossValidateAnalysis(text, initialHumanProbability) {
    const sections = text.split(/\n\s*\n/).filter(s => s.trim().length > 100);
    if (sections.length < 3) {
        return {
            adjustedProbability: initialHumanProbability,
            details: "Texto muito curto para validação cruzada"
        };
    }
    
    let styleConsistency = 0;
    const sectionFeatures = [];
    
    sections.forEach((section, idx) => {
        if (section.trim().length > 100) {
            const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const words = section.toLowerCase().match(/[\wÀ-ÿ]+/g) || [];
            const uniqueWords = new Set(words);
            
            const features = {
                sentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
                lexicalRichness: words.length > 0 ? (uniqueWords.size / words.length) * 100 : 0,
                transitionWords: (section.match(/\b(?:portanto|assim|logo|pois|contudo|entretanto|no entanto)\b/gi) || []).length
            };
            sectionFeatures.push(features);
        }
    });
    
    // Calcular variância (alta variância = mais humano)
    if (sectionFeatures.length > 2) {
        const avgLexical = sectionFeatures.reduce((a, f) => a + f.lexicalRichness, 0) / sectionFeatures.length;
        const variance = sectionFeatures.reduce((a, f) => a + Math.pow(f.lexicalRichness - avgLexical, 2), 0) / sectionFeatures.length;
        
        let adjustment = 0;
        let details = "";
        
        if (variance > 50) {
            adjustment = 15;
            details = "Alta variância estilística entre seções (forte indicador humano)";
        } else if (variance < 15) {
            adjustment = -10;
            details = "Baixa variância estilística (possível padronização automática)";
        } else {
            details = "Variância estilística dentro do esperado";
        }
        
        return {
            adjustedProbability: Math.max(0, Math.min(100, initialHumanProbability + adjustment)),
            variance: Math.round(variance),
            adjustment: adjustment,
            details: details
        };
    }
    
    return {
        adjustedProbability: initialHumanProbability,
        details: "Validação cruzada inconclusiva"
    };
}

// ANÁLISE BALANCEADA - FUNÇÕES AUXILIARES
function calculateLexicalRichness(text) {
    const words = text.toLowerCase().match(/[\wÀ-ÿ]+/g) || [];
    const uniqueWords = new Set(words);
    return words.length > 0 ? (uniqueWords.size / words.length) * 100 : 0;
}

function analyzeStructuralPatterns(text) {
    let score = 0;
    
    // Penalidades moderadas para estrutura muito padronizada
    const boldSections = (text.match(/\*\*.*?\*\*/g) || []).length;
    if (boldSections > 8) score -= Math.min(boldSections * 1.5, 25);
    
    const numberedSections = (text.match(/^(\d+\.)+/gm) || []).length;
    if (numberedSections > 12) score -= Math.min(numberedSections * 1, 20);
    
    return Math.max(-30, score);
}

function detectStrongAIPatterns(text) {
    let totalScore = 0;
    const detectedPatterns = [];

    strongAIPatterns.forEach(patternObj => {
        const matches = text.match(patternObj.pattern);
        if (matches && matches.length > 0) {
            const score = Math.min(matches.length * patternObj.weight, 100);
            totalScore += score;

            detectedPatterns.push({
                pattern: patternObj.pattern.source.substring(0, 50) + '...',
                matches: matches.length,
                description: patternObj.description,
                examples: matches.slice(0, 3),
                score: score
            });
        }
    });

    return {
        patterns: detectedPatterns,
        totalScore: totalScore,
        normalizedScore: Math.min(totalScore / 6, 80)
    };
}

function detectStrongHumanPatterns(text) {
    let totalScore = 0;
    const detectedPatterns = [];

    strongHumanPatterns.forEach(patternObj => {
        const matches = text.match(patternObj.pattern);
        if (matches && matches.length > 0) {
            // Para padrões com peso negativo (penalidades)
            const score = patternObj.weight < 0 ? 
                Math.max(-100, matches.length * patternObj.weight) : 
                Math.min(matches.length * patternObj.weight, 80);
            
            totalScore += score;

            detectedPatterns.push({
                pattern: patternObj.pattern.source.substring(0, 50) + '...',
                matches: matches.length,
                description: patternObj.description,
                examples: matches.slice(0, 4),
                score: score
            });
        }
    });

    return {
        patterns: detectedPatterns,
        totalScore: totalScore,
        normalizedScore: Math.min(totalScore / 6, 75)
    };
}

// ALGORITMO PRINCIPAL - AVANÇADO E CONTEXTUAL
async function advancedAnalyzeContent(text, contentType) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Métricas básicas
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length - 1;
    const paragraphCount = text.split(/\n\s*\n/).length;

    // Análises principais
    const lexicalRichness = calculateLexicalRichness(text);
    const structuralPenalty = analyzeStructuralPatterns(text);
    const aiPatternAnalysis = detectStrongAIPatterns(text);
    const humanPatternAnalysis = detectStrongHumanPatterns(text);

    // NOVAS ANÁLISES
    const perplexityAnalysis = calculatePerplexityScore(text);
    const conclusionAnalysis = analyzeConclusionPatterns(text);

    // AJUSTE POR TIPO DE CONTEÚDO
    const adjustedScores = adjustWeightsByContentType(
        contentType, 
        aiPatternAnalysis.normalizedScore, 
        humanPatternAnalysis.normalizedScore
    );

    // CÁLCULO DO SCORE - ALGORITMO AVANÇADO
    let humanScore = 50 + adjustedScores.thresholdAdjustment; // Base com ajuste contextual

    // PADRÕES DE IA COM PESO AJUSTADO POR CONTEXTO
    humanScore -= adjustedScores.aiAdjusted * 0.7;

    // PADRÕES HUMANOS COM BÔNUS AJUSTADO POR CONTEXTO
    humanScore += adjustedScores.humanAdjusted * 0.8;

    // PENALIDADE ESTRUTURAL COM AJUSTE CONTEXTUAL
    if (contentType !== 'academic') {
        humanScore += structuralPenalty;
    } else {
        humanScore += structuralPenalty * 0.5; // Metade da penalidade para acadêmicos
    }

    // DETECÇÃO DE PADRÕES EXPLÍCITOS DE IA (peso muito alto)
    const hasExplicitIANote = text.includes('**Nota do Autor:**') || 
                             text.includes('**Nota de IA:**') &&
                             (text.includes('ChatGPT') || text.includes('IA') || 
                              text.includes('modelo') || text.includes('gerado') ||
                              text.includes('inteligência artificial') || text.includes('OpenAI'));
    
    if (hasExplicitIANote) {
        humanScore = Math.max(10, humanScore - 40);
    }

    // DETECÇÃO DE AUTO-IDENTIFICAÇÃO COMO IA
    const hasSelfIdentification = text.match(/\b(?:como um modelo de IA|como uma inteligência artificial|sou um assistente AI|como um algoritmo de linguagem)\b/gi);
    if (hasSelfIdentification) {
        humanScore = Math.max(5, humanScore - 50);
    }

    // CONSIDERAR PERPLEXIDADE (variação lexical)
    if (perplexityAnalysis.score < 20) {
        humanScore -= 25; // Baixa variação sugere IA
    } else if (perplexityAnalysis.score > 50) {
        humanScore += 20; // Alta variação sugere humano
    }

    // CONSIDERAR PADRÕES DE CONCLUSÃO
    humanScore -= conclusionAnalysis.score * 0.6;

    // PADRÕES DE FORMATAÇÃO
    const boldCount = (text.match(/\*\*.*?\*\*/g) || []).length;
    if (boldCount > 12 && contentType !== 'academic') {
        humanScore -= Math.min(boldCount * 0.8, 20);
    }

    // VALIDAÇÃO CRUZADA
    const crossValidation = crossValidateAnalysis(text, humanScore);
    humanScore = crossValidation.adjustedProbability;

    // APLICAR LIMITES FINAIS
    const humanProbability = Math.max(5, Math.min(95, humanScore));
    const confidence = calculateConfidence(humanProbability, aiPatternAnalysis, humanPatternAnalysis, perplexityAnalysis);

    // Gerar destaques
    const textHighlights = generateTextHighlights(text, aiPatternAnalysis, humanPatternAnalysis);

    // Gerar sugestões
    const suggestions = generateSuggestions(humanProbability, aiPatternAnalysis, humanPatternAnalysis, text, contentType);

    return {
        humanProbability,
        aiProbability: 100 - humanProbability,
        analyzedText: text,
        wordCount,
        sentenceCount,
        paragraphCount,
        contentType,
        confidence,
        advancedMetrics: {
            aiPatternScore: Math.round(aiPatternAnalysis.normalizedScore),
            humanPatternScore: Math.round(humanPatternAnalysis.normalizedScore),
            lexicalRichness: Math.round(lexicalRichness),
            structuralPenalty: Math.round(structuralPenalty),
            boldCount: boldCount,
            strongAIPatterns: aiPatternAnalysis.patterns.length,
            strongHumanPatterns: humanPatternAnalysis.patterns.length,
            hasExplicitIANote: hasExplicitIANote,
            perplexityScore: Math.round(perplexityAnalysis.score),
            conclusionAIScore: Math.round(conclusionAnalysis.score),
            contextAdjustment: adjustedScores.thresholdAdjustment,
            crossValidationVariance: crossValidation.variance
        },
        detailedMetrics: {
            aiPatternAnalysis: aiPatternAnalysis,
            humanPatternAnalysis: humanPatternAnalysis,
            perplexityAnalysis: perplexityAnalysis,
            conclusionAnalysis: conclusionAnalysis,
            crossValidation: crossValidation,
            contextAdjustment: adjustedScores
        },
        textHighlights,
        suggestions,
        detailedExplanation: generateDetailedExplanation({
            humanProbability, 
            aiPatternScore: aiPatternAnalysis.normalizedScore,
            humanPatternScore: humanPatternAnalysis.normalizedScore,
            lexicalRichness,
            structuralPenalty,
            aiPatterns: aiPatternAnalysis.patterns,
            humanPatterns: humanPatternAnalysis.patterns,
            boldCount: boldCount,
            hasExplicitIANote: hasExplicitIANote,
            perplexityScore: perplexityAnalysis.score,
            conclusionScore: conclusionAnalysis.score,
            contextType: contentType,
            contextDescription: adjustedScores.description,
            crossValidationDetails: crossValidation.details
        })
    };
}

function calculateConfidence(humanProb, aiPatternAnalysis, humanPatternAnalysis, perplexityAnalysis) {
    let confidence = 70; // Base

    // Aumentar confiança baseado na força dos sinais
    if (aiPatternAnalysis.normalizedScore > 50 || humanPatternAnalysis.normalizedScore > 50) {
        confidence += 15;
    }

    // Aumentar confiança para resultados extremos
    if (humanProb > 80 || humanProb < 20) {
        confidence += 10;
    }

    // Aumentar confiança baseado na análise de perplexidade
    if (perplexityAnalysis.score < 20 || perplexityAnalysis.score > 50) {
        confidence += 5;
    }

    return Math.min(95, confidence);
}

function generateTextHighlights(text, aiPatternAnalysis, humanPatternAnalysis) {
    const highlights = {
        aiPatterns: [],
        humanElements: []
    };

    // Padrões de IA
    aiPatternAnalysis.patterns.forEach(pattern => {
        if (pattern.examples && pattern.examples.length > 0) {
            pattern.examples.forEach(example => {
                const start = text.toLowerCase().indexOf(example.toLowerCase());
                if (start !== -1) {
                    highlights.aiPatterns.push({
                        start,
                        end: start + example.length,
                        text: example,
                        description: pattern.description
                    });
                }
            });
        }
    });

    // Padrões humanos
    humanPatternAnalysis.patterns.forEach(pattern => {
        if (pattern.examples && pattern.examples.length > 0) {
            pattern.examples.forEach(example => {
                const start = text.toLowerCase().indexOf(example.toLowerCase());
                if (start !== -1) {
                    highlights.humanElements.push({
                        start,
                        end: start + example.length,
                        text: example,
                        description: pattern.description
                    });
                }
            });
        }
    });

    return highlights;
}

function generateSuggestions(humanProb, aiPatternAnalysis, humanPatternAnalysis, text, contentType) {
    const suggestions = [];
    const hasExplicitIANote = text.includes('**Nota do Autor:**') || 
                             text.includes('**Nota de IA:**') &&
                             (text.includes('ChatGPT') || text.includes('IA') || 
                              text.includes('modelo') || text.includes('gerado'));

    if (hasExplicitIANote) {
        suggestions.push('🚨 NOTA EXPLÍCITA DE IA DETECTADA - Confirmação de conteúdo gerado por IA');
    }

    // SUGESTÕES BASEADAS NO TIPO DE CONTEÚDO
    suggestions.push(`📝 Modo de análise: ${contentType.toUpperCase()}`);
    
    if (contentType === 'academic') {
        suggestions.push('✅ Modo acadêmico ativo: tolerante com estruturas formais, valoriza complexidade');
    } else if (contentType === 'creative') {
        suggestions.push('🎨 Modo criativo ativo: rigoroso com clichês e fórmulas padronizadas');
    }

    // LIMIARES BALANCEADOS
    if (humanProb >= 80) {
        suggestions.push('✅ ALTA PROBABILIDADE DE CONTEÚDO HUMANO');
        suggestions.push('✓ Múltiplos padrões humanos identificados');
        suggestions.push('✓ Características de autoria genuína');
    } else if (humanProb >= 65) {
        suggestions.push('✅ PROVÁVEL CONTEÚDO HUMANO');
        suggestions.push('✓ Elementos humanos predominantes');
    } else if (humanProb >= 50) {
        suggestions.push('⚖️ CARACTERÍSTICAS MISTAS');
        suggestions.push('• Combinação de elementos humanos e de IA');
    } else if (humanProb >= 30) {
        suggestions.push('🤔 PROVÁVEL CONTEÚDO DE IA');
        suggestions.push('• Padrões de IA detectados');
        suggestions.push('• Recomenda-se verificação adicional');
    } else {
        suggestions.push('🚨 ALTA PROBABILIDADE DE IA GENERATIVA');
        suggestions.push('• Múltiplos indicadores de IA');
        suggestions.push('• Padrões característicos detectados');
    }

    if (humanPatternAnalysis.patterns.length > 0) {
        suggestions.push(`✓ ${humanPatternAnalysis.patterns.length} elementos humanos detectados`);
    }

    if (aiPatternAnalysis.patterns.length > 0) {
        suggestions.push(`• ${aiPatternAnalysis.patterns.length} padrões de IA detectados`);
    }

    // SUGESTÕES DE MELHORIA
    const boldCount = (text.match(/\*\*.*?\*\*/g) || []).length;
    if (boldCount > 15) {
        suggestions.push('💡 Sugestão: Reduzir uso excessivo de negrito para parecer mais natural');
    }

    const sentenceLengthVariation = text.split(/[.!?]+/).filter(s => s.trim()).length;
    if (sentenceLengthVariation < 10 && text.length > 500) {
        suggestions.push('💡 Sugestão: Variar mais o comprimento das frases');
    }

    return suggestions;
}

function generateDetailedExplanation(metrics) {
    const explanations = [];

    // Contexto
    explanations.push(`CONTEXTO: ${metrics.contextDescription}`);

    // Detecções explícitas
    if (metrics.hasExplicitIANote) {
        explanations.push('🚨 NOTA EXPLÍCITA DE IA DETECTADA');
    }

    // Análise de padrões
    if (metrics.aiPatternScore > 40) {
        explanations.push('FORTES INDÍCIOS DE IA: Múltiplos padrões detectados');
    } else if (metrics.aiPatternScore > 20) {
        explanations.push('INDÍCIOS DE IA: Alguns padrões presentes');
    }

    if (metrics.humanPatternScore > 35) {
        explanations.push('FORTES INDÍCIOS HUMANOS: Características genuínas de autoria');
    } else if (metrics.humanPatternScore > 20) {
        explanations.push('INDÍCIOS HUMANOS: Elementos de escrita natural');
    }

    // Análise de perplexidade
    if (metrics.perplexityScore > 45) {
        explanations.push('Alta variação lexical - forte indicador humano');
    } else if (metrics.perplexityScore < 25) {
        explanations.push('Baixa variação lexical - possível padronização automática');
    }

    // Análise de conclusão
    if (metrics.conclusionScore > 20) {
        explanations.push('Padrões de conclusão característicos de IA detectados');
    }

    // Validação cruzada
    if (metrics.crossValidationDetails) {
        explanations.push(`VALIDAÇÃO CRUZADA: ${metrics.crossValidationDetails}`);
    }

    // Veredito final
    if (metrics.humanProbability >= 80) {
        explanations.push('VEREDITO: Alta probabilidade de conteúdo humano');
    } else if (metrics.humanProbability >= 65) {
        explanations.push('VEREDITO: Provável conteúdo humano');
    } else if (metrics.humanProbability >= 50) {
        explanations.push('VEREDITO: Características mistas');
    } else if (metrics.humanProbability >= 30) {
        explanations.push('VEREDITO: Provável conteúdo de IA');
    } else {
        explanations.push('VEREDITO: Alta probabilidade de IA generativa');
    }

    return explanations;
}

// INICIALIZAÇÃO QUANDO A PÁGINA CARREGA
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('resultsContainer');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const contextIndicator = document.getElementById('contextIndicator');
    const perplexityDisplay = document.getElementById('perplexityDisplay');

    // Atualizar indicador de contexto
    document.getElementById('contentType').addEventListener('change', function() {
        const type = this.value;
        const descriptions = {
            academic: "Ajuste para escrita acadêmica formal",
            technical: "Ajuste para conteúdo técnico",
            creative: "Ajuste rigoroso para conteúdo criativo",
            business: "Ajuste padrão para negócios",
            casual: "Ajuste para escrita casual"
        };
        contextIndicator.textContent = descriptions[type] || "Ajusta análise por contexto";
    });

    // Event Listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);

    analyzeBtn.addEventListener('click', startAnalysis);
    clearBtn.addEventListener('click', clearAll);
    downloadPdfBtn.addEventListener('click', generateDetailedPDF);

    // Funções de manipulação de arquivos
    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.style.background = '#eef2ff';
    }

    function handleFileDrop(e) {
        e.preventDefault();
        uploadArea.style.background = '#f8f9ff';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelection(files[0]);
        }
    }

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        // Validar tipo de arquivo
        const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
        if (!validExtensions.includes(fileExtension)) {
            alert('Tipo de arquivo não suportado. Use PDF, DOCX, DOC ou TXT.');
            return;
        }

        // Limpar campo de texto quando arquivo é selecionado
        textInput.value = '';

        // Atualizar interface
        uploadArea.innerHTML = `
            <i>✅</i>
            <h3>Arquivo selecionado:</h3>
            <p><strong>${fileName}</strong></p>
            <p>Clique em "Analisar Conteúdo" para continuar</p>
        `;
    }

    // Função principal de análise
    async function startAnalysis() {
        const file = fileInput.files[0];
        const text = textInput.value.trim();
        const contentType = document.getElementById('contentType').value;

        // Validar entrada
        if (!file && !text) {
            alert('Por favor, selecione um arquivo ou cole um texto para análise.');
            return;
        }

        // Mostrar loading
        loading.style.display = 'block';
        resultsContainer.style.display = 'none';

        try {
            let content = '';

            // Extrair texto do arquivo ou usar texto direto
            if (file) {
                content = await extractTextFromFile(file);
            } else {
                content = text;
            }

            // Validar conteúdo extraído
            if (!content || content.trim().length < 50) {
                throw new Error('Conteúdo muito curto ou vazio. Forneça um texto com pelo menos 50 caracteres.');
            }

            // Realizar análise avançada
            const analysisResult = await advancedAnalyzeContent(content, contentType);

            // Armazenar resultado atual
            currentAnalysisResult = analysisResult;

            // Exibir resultados
            displayResults(analysisResult);

        } catch (error) {
            console.error('Erro na análise:', error);
            alert('Erro ao analisar o conteúdo: ' + error.message);
        } finally {
            loading.style.display = 'none';
            resultsContainer.style.display = 'block';
        }
    }

    // Função para extrair texto de diferentes tipos de arquivo
    async function extractTextFromFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async function(e) {
                try {
                    let text = '';

                    switch (fileExtension) {
                        case 'txt':
                            text = e.target.result;
                            break;

                        case 'pdf':
                            text = await extractTextFromPDF(e.target.result);
                            break;

                        case 'docx':
                        case 'doc':
                            text = await extractTextFromDOCX(e.target.result);
                            break;

                        default:
                            reject(new Error('Formato de arquivo não suportado'));
                            return;
                    }

                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

            if (fileExtension === 'pdf') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsBinaryString(file);
            }
        });
    }

    // Extrair texto de PDF
    async function extractTextFromPDF(arrayBuffer) {
        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            throw new Error('Erro ao extrair texto do PDF: ' + error.message);
        }
    }

    // Extrair texto de DOCX/DOC
    async function extractTextFromDOCX(arrayBuffer) {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            throw new Error('Erro ao extrair texto do documento: ' + error.message);
        }
    }

    // Exibir resultados na interface
    function displayResults(result) {
        // Atualizar barra de probabilidade
        const humanProbBar = document.getElementById('humanProbabilityBar');
        humanProbBar.style.width = `${result.humanProbability}%`;

        // Atualizar texto de probabilidade
        const probText = document.getElementById('probabilityText');
        let verdictText = '';
        let verdictColor = '';
        let confidenceClass = '';

        if (result.confidence >= 80) confidenceClass = 'high-confidence';
        else if (result.confidence >= 70) confidenceClass = 'medium-confidence';
        else confidenceClass = 'low-confidence';

        // LIMIARES BALANCEADOS
        if (result.humanProbability >= 80) {
            verdictText = 'ALTA PROBABILIDADE DE CONTEÚDO HUMANO';
            verdictColor = '#27ae60';
        } else if (result.humanProbability >= 65) {
            verdictText = 'PROVÁVEL CONTEÚDO HUMANO';
            verdictColor = '#2ecc71';
        } else if (result.humanProbability >= 50) {
            verdictText = 'CARACTERÍSTICAS MISTAS';
            verdictColor = '#f39c12';
        } else if (result.humanProbability >= 30) {
            verdictText = 'PROVÁVEL CONTEÚDO DE IA';
            verdictColor = '#e74c3c';
        } else {
            verdictText = 'ALTA PROBABILIDADE DE IA GENERATIVA';
            verdictColor = '#c0392b';
        }

        probText.innerHTML = `
            <span style="color: ${verdictColor}">${verdictText}</span>
            <span class="confidence-indicator ${confidenceClass}">Confiança: ${result.confidence}%</span><br>
            <small>Humano: ${result.humanProbability}% | IA: ${result.aiProbability}%</small>
        `;

        // Exibir análise de perplexidade
        if (result.detailedMetrics.perplexityAnalysis) {
            perplexityDisplay.style.display = 'block';
            const perplexity = result.detailedMetrics.perplexityAnalysis;
            const perplexityClass = perplexity.score > 45 ? 'good-metric' : perplexity.score < 25 ? 'bad-metric' : 'warning-metric';
            perplexityDisplay.innerHTML = `
                <strong>Análise de Variação Lexical (Perplexidade):</strong> 
                <span class="${perplexityClass}">${Math.round(perplexity.score)}%</span> - 
                ${perplexity.details}
                ${perplexity.similarEndings > 2 ? ` (${perplexity.similarEndings} frases com finais similares)` : ''}
            `;
        }

        // Atualizar métricas avançadas
        displayAdvancedMetrics(result.advancedMetrics, result.contentType);

        // Atualizar detalhes da análise
        const analysisDetails = document.getElementById('analysisDetails');
        analysisDetails.innerHTML = `
            <div class="detail-item" title="Tipo de conteúdo analisado com ajustes contextuais específicos">
                <strong>Tipo de Conteúdo:</strong> ${document.querySelector(`#contentType option[value="${result.contentType}"]`).textContent}
                <span class="context-indicator">${result.detailedMetrics.contextAdjustment.description}</span>
            </div>
            <div class="detail-item" title="Estatísticas básicas do texto analisado">
                <strong>Estatísticas do Texto:</strong> ${result.wordCount} palavras, ${result.sentenceCount} sentenças, ${result.paragraphCount} parágrafos
            </div>
            <div class="detail-item" title="Padrões linguísticos característicos de escrita humana detectados">
                <strong>Elementos Humanos Detectados:</strong> ${result.detailedMetrics.humanPatternAnalysis.patterns.length} padrões
                ${result.detailedMetrics.humanPatternAnalysis.normalizedScore > 30 ? ' (FORTES)' : ''}
            </div>
            <div class="detail-item" title="Padrões característicos de geração automática por IA">
                <strong>Padrões de IA Detectados:</strong> ${result.detailedMetrics.aiPatternAnalysis.patterns.length} padrões
                ${result.detailedMetrics.aiPatternAnalysis.normalizedScore > 30 ? ' (FORTES)' : ''}
            </div>
            <div class="detail-item" title="Diversidade vocabular do texto">
                <strong>Riqueza Lexical:</strong> ${result.advancedMetrics.lexicalRichness}%
                ${result.advancedMetrics.lexicalRichness > 35 ? ' (Alta)' : result.advancedMetrics.lexicalRichness < 25 ? ' (Baixa)' : ''}
            </div>
            <div class="detail-item" title="Ajuste aplicado baseado no tipo de conteúdo selecionado">
                <strong>Ajuste Contextual:</strong> ${result.advancedMetrics.contextAdjustment > 0 ? '+' : ''}${result.advancedMetrics.contextAdjustment} pontos
            </div>
            <div class="detail-item" title="Análise detalhada com todos os fatores considerados">
                <strong>Análise Detalhada:</strong> 
                ${result.detailedExplanation.join('; ')}
            </div>
        `;

        // Exibir texto com destaques
        displayTextWithHighlights(result);

        // Exibir sugestões
        const suggestionsDiv = document.getElementById('suggestions');
        if (result.suggestions && result.suggestions.length > 0) {
            suggestionsDiv.innerHTML = `
                <h4>Análise e Recomendações:</h4>
                <ul>
                    ${result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            `;
        }
    }

    function displayAdvancedMetrics(metrics, contentType) {
        const metricsContainer = document.getElementById('advancedMetrics');

        const getMetricClass = (value, goodThreshold, warningThreshold) => {
            if (value >= goodThreshold) return 'good-metric';
            if (value >= warningThreshold) return 'warning-metric';
            return 'bad-metric';
        };

        // Definições das métricas para tooltips
        const metricTitles = {
            humanPatternScore: "Pontuação de elementos humanos detectados\nValores altos indicam características genuínas de autoria",
            aiPatternScore: "Pontuação de padrões característicos de IA\nValores altos sugerem conteúdo automatizado",
            lexicalRichness: "Diversidade vocabular (palavras únicas / total)\nAcima de 35% é bom indicador humano",
            perplexityScore: "Variação estrutural entre frases e parágrafos\nBaixa variação sugere padronização automática",
            boldCount: "Uso de negrito no texto\nAcima de 10 pode indicar formatação automatizada",
            conclusionAIScore: "Padrões de conclusão característicos de IA\nAcima de 20 sugere estrutura previsível"
        };

        metricsContainer.innerHTML = `
            <div class="metric-card" title="${metricTitles.humanPatternScore}">
                <div>Elementos Humanos</div>
                <div class="metric-value ${getMetricClass(metrics.humanPatternScore, 25, 15)}">${metrics.humanPatternScore}%</div>
                <small>${metrics.humanPatternScore >= 25 ? 'Alto' : metrics.humanPatternScore >= 15 ? 'Moderado' : 'Baixo'}</small>
            </div>
            <div class="metric-card" title="${metricTitles.aiPatternScore}">
                <div>Padrões IA</div>
                <div class="metric-value ${getMetricClass(-metrics.aiPatternScore, -20, -35)}">${metrics.aiPatternScore}%</div>
                <small>${metrics.aiPatternScore >= 35 ? 'Alto' : metrics.aiPatternScore >= 20 ? 'Moderado' : 'Baixo'}</small>
            </div>
            <div class="metric-card" title="${metricTitles.lexicalRichness}">
                <div>Riqueza Lexical</div>
                <div class="metric-value ${getMetricClass(metrics.lexicalRichness, 35, 25)}">${metrics.lexicalRichness}%</div>
                <small>${metrics.lexicalRichness >= 35 ? 'Alta' : metrics.lexicalRichness >= 25 ? 'Média' : 'Baixa'}</small>
            </div>
            <div class="metric-card" title="${metricTitles.perplexityScore}">
                <div>Variação Estrutural</div>
                <div class="metric-value ${getMetricClass(metrics.perplexityScore, 45, 25)}">${metrics.perplexityScore}%</div>
                <small>${metrics.perplexityScore >= 45 ? 'Alta' : metrics.perplexityScore >= 25 ? 'Média' : 'Baixa'}</small>
            </div>
            <div class="metric-card" title="${metricTitles.boldCount}">
                <div>Uso de Negrito</div>
                <div class="metric-value ${getMetricClass(-metrics.boldCount, -5, -10)}">${metrics.boldCount}</div>
                <small>${metrics.boldCount >= 12 ? 'Alto' : metrics.boldCount >= 8 ? 'Moderado' : 'Normal'}</small>
            </div>
            <div class="metric-card" title="${metricTitles.conclusionAIScore}">
                <div>Padrões Conclusão</div>
                <div class="metric-value ${getMetricClass(-metrics.conclusionAIScore, -10, -20)}">${metrics.conclusionAIScore}%</div>
                <small>${metrics.conclusionAIScore >= 20 ? 'Alto' : metrics.conclusionAIScore >= 10 ? 'Moderado' : 'Baixo'}</small>
            </div>
        `;
    }

    // Exibir texto com destaques
    function displayTextWithHighlights(result) {
        const textPreview = document.getElementById('textPreview');
        let highlightedText = result.analyzedText;

        // Ordenar destaques por posição (do final para o início para não afetar índices)
        const allHighlights = [
            ...result.textHighlights.aiPatterns.map(h => ({...h, type: 'ai'})),
            ...result.textHighlights.humanElements.map(h => ({...h, type: 'human'}))
        ].sort((a, b) => b.start - a.start);

        // Aplicar destaques
        allHighlights.forEach(highlight => {
            const before = highlightedText.substring(0, highlight.start);
            const target = highlightedText.substring(highlight.start, highlight.end);
            const after = highlightedText.substring(highlight.end);

            if (highlight.type === 'ai') {
                highlightedText = before + 
                    `<span class="highlight-ai" title="${highlight.description}">${target}</span>` + 
                    after;
            } else {
                highlightedText = before + 
                    `<span class="highlight-human" title="${highlight.description}">${target}</span>` + 
                    after;
            }
        });

        textPreview.innerHTML = highlightedText || '<p>Nenhum texto disponível para visualização.</p>';
    }

    // Limpar tudo
    function clearAll() {
        fileInput.value = '';
        textInput.value = '';
        resultsContainer.style.display = 'none';
        perplexityDisplay.style.display = 'none';

        uploadArea.innerHTML = `
            <i>📄</i>
            <h3>Arraste e solte arquivos aqui</h3>
            <p>ou clique para selecionar</p>
            <p>Formatos suportados: PDF, DOCX, DOC, TXT</p>
        `;

        currentAnalysisResult = null;
    }

    // FUNÇÃO GERAR PDF COMPLETO
    function generateDetailedPDF() {
        if (!currentAnalysisResult) {
            alert('Nenhum resultado de análise disponível para gerar PDF.');
            return;
        }

        alert('Funcionalidade de PDF será implementada em breve.');
    }
});
