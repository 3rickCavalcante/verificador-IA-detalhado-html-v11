// =============================================
// DETECTOR AVANÇADO DE CONTEÚDO HUMANO vs IA
// Versão Corrigida - script.js
// =============================================

// VARIÁVEL GLOBAL PARA ARMAZENAR RESULTADOS
let currentAnalysisResult = null;

// =============================================
// PADRÕES DE DETECÇÃO DE IA
// =============================================
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

// =============================================
// PADRÕES DE DETECÇÃO HUMANA
// =============================================
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

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

// FUNÇÃO: Ajustar pesos por tipo de conteúdo
function adjustWeightsByContentType(contentType, aiScore, humanScore) {
    const adjustments = {
        academic: {
            aiMultiplier: 0.7,
            humanMultiplier: 1.2,
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
            aiMultiplier: 1.3,
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
        aiAdjusted: (aiScore || 0) * adj.aiMultiplier,
        humanAdjusted: (humanScore || 0) * adj.humanMultiplier,
        thresholdAdjustment: adj.thresholdAdjustment,
        description: adj.description
    };
}

// FUNÇÃO: Calcular perplexidade (variação lexical)
function calculatePerplexityScore(text) {
    try {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length < 3) return { 
            score: 50, 
            details: "Texto muito curto para análise de perplexidade" 
        };
        
        let totalVariation = 0;
        let previousSentenceEnding = '';
        let similarEndings = 0;
        
        sentences.forEach((sentence) => {
            const words = sentence.toLowerCase().match(/[\wÀ-ÿ]+/g) || [];
            if (words.length < 5) return;
            
            const uniqueWords = new Set(words);
            const lexicalDiversity = (uniqueWords.size / words.length) * 100;
            
            const endingWords = words.slice(-3).join(' ');
            if (endingWords && endingWords === previousSentenceEnding && words.length > 8) {
                similarEndings++;
                totalVariation -= 15;
            }
            
            totalVariation += lexicalDiversity;
            previousSentenceEnding = endingWords;
        });
        
        const avgVariation = totalVariation / sentences.length;
        const score = Math.max(0, Math.min(100, avgVariation));
        
        return {
            score: score,
            similarEndings: similarEndings,
            sentenceCount: sentences.length,
            details: similarEndings > 2 ? "Muitas frases com finais similares" : "Boa variação estrutural"
        };
    } catch (error) {
        console.error('Erro em calculatePerplexityScore:', error);
        return { score: 50, details: "Erro na análise de perplexidade" };
    }
}

// FUNÇÃO: Analisar padrões de conclusão
function analyzeConclusionPatterns(text) {
    try {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        if (paragraphs.length < 2) return { 
            score: 0, 
            patterns: [],
            details: "Texto muito curto para análise de conclusão" 
        };
        
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
    } catch (error) {
        console.error('Erro em analyzeConclusionPatterns:', error);
        return { score: 0, patterns: [], details: "Erro na análise de conclusão" };
    }
}

// FUNÇÃO: Validação cruzada de análise
function crossValidateAnalysis(text, initialHumanProbability) {
    try {
        const sections = text.split(/\n\s*\n/).filter(s => s.trim().length > 100);
        if (sections.length < 3) {
            return {
                adjustedProbability: initialHumanProbability,
                variance: 0,
                adjustment: 0,
                details: "Texto muito curto para validação cruzada"
            };
        }
        
        const sectionFeatures = [];
        
        sections.forEach((section) => {
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
            variance: 0,
            adjustment: 0,
            details: "Validação cruzada inconclusiva"
        };
    } catch (error) {
        console.error('Erro em crossValidateAnalysis:', error);
        return {
            adjustedProbability: initialHumanProbability,
            variance: 0,
            adjustment: 0,
            details: "Erro na validação cruzada"
        };
    }
}

// FUNÇÃO: Calcular riqueza lexical
function calculateLexicalRichness(text) {
    try {
        const words = text.toLowerCase().match(/[\wÀ-ÿ]+/g) || [];
        if (words.length === 0) return 0;
        
        const uniqueWords = new Set(words);
        return (uniqueWords.size / words.length) * 100;
    } catch (error) {
        console.error('Erro em calculateLexicalRichness:', error);
        return 0;
    }
}

// FUNÇÃO: Analisar padrões estruturais
function analyzeStructuralPatterns(text) {
    try {
        let score = 0;
        
        const boldSections = (text.match(/\*\*.*?\*\*/g) || []).length;
        if (boldSections > 8) score -= Math.min(boldSections * 1.5, 25);
        
        const numberedSections = (text.match(/^(\d+\.)+/gm) || []).length;
        if (numberedSections > 12) score -= Math.min(numberedSections * 1, 20);
        
        return Math.max(-30, score);
    } catch (error) {
        console.error('Erro em analyzeStructuralPatterns:', error);
        return 0;
    }
}

// FUNÇÃO: Detectar padrões de IA
function detectStrongAIPatterns(text) {
    try {
        let totalScore = 0;
        const detectedPatterns = [];

        strongAIPatterns.forEach(patternObj => {
            try {
                const matches = text.match(patternObj.pattern) || [];
                if (matches.length > 0) {
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
            } catch (error) {
                console.warn('Erro ao processar padrão de IA:', patternObj.description, error);
            }
        });

        return {
            patterns: detectedPatterns,
            totalScore: totalScore,
            normalizedScore: Math.min(totalScore / 6, 80)
        };
    } catch (error) {
        console.error('Erro em detectStrongAIPatterns:', error);
        return {
            patterns: [],
            totalScore: 0,
            normalizedScore: 0
        };
    }
}

// FUNÇÃO: Detectar padrões humanos
function detectStrongHumanPatterns(text) {
    try {
        let totalScore = 0;
        const detectedPatterns = [];

        strongHumanPatterns.forEach(patternObj => {
            try {
                const matches = text.match(patternObj.pattern) || [];
                if (matches.length > 0) {
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
            } catch (error) {
                console.warn('Erro ao processar padrão humano:', patternObj.description, error);
            }
        });

        return {
            patterns: detectedPatterns,
            totalScore: totalScore,
            normalizedScore: Math.min(totalScore / 6, 75)
        };
    } catch (error) {
        console.error('Erro em detectStrongHumanPatterns:', error);
        return {
            patterns: [],
            totalScore: 0,
            normalizedScore: 0
        };
    }
}

// FUNÇÃO: Análise avançada do conteúdo
async function advancedAnalyzeContent(text, contentType) {
    console.log('Iniciando análise avançada para tipo:', contentType);
    
    try {
        // Simular delay para mostrar loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Métricas básicas
        const wordCount = text.split(/\s+/).length;
        const sentenceCount = text.split(/[.!?]+/).length - 1;
        const paragraphCount = text.split(/\n\s*\n/).length;
        
        console.log('Métricas básicas calculadas:', { wordCount, sentenceCount, paragraphCount });
        
        // Análises principais
        const lexicalRichness = calculateLexicalRichness(text);
        const structuralPenalty = analyzeStructuralPatterns(text);
        const aiPatternAnalysis = detectStrongAIPatterns(text);
        const humanPatternAnalysis = detectStrongHumanPatterns(text);
        
        console.log('Análises principais:', {
            lexicalRichness,
            structuralPenalty,
            aiPatterns: aiPatternAnalysis.patterns.length,
            humanPatterns: humanPatternAnalysis.patterns.length
        });
        
        // Análises avançadas
        const perplexityAnalysis = calculatePerplexityScore(text);
        const conclusionAnalysis = analyzeConclusionPatterns(text);
        
        // Ajuste por tipo de conteúdo
        const adjustedScores = adjustWeightsByContentType(
            contentType, 
            aiPatternAnalysis.normalizedScore, 
            humanPatternAnalysis.normalizedScore
        );
        
        console.log('Ajustes contextuais:', adjustedScores);
        
        // CÁLCULO DO SCORE
        let humanScore = 50 + (adjustedScores.thresholdAdjustment || 0);
        
        // Padrões de IA
        humanScore -= (adjustedScores.aiAdjusted || 0) * 0.7;
        
        // Padrões humanos
        humanScore += (adjustedScores.humanAdjusted || 0) * 0.8;
        
        // Penalidade estrutural
        if (contentType !== 'academic') {
            humanScore += structuralPenalty;
        } else {
            humanScore += structuralPenalty * 0.5;
        }
        
        // Detecção explícita de IA
        const hasExplicitIANote = text.includes('**Nota do Autor:**') || 
                                 text.includes('**Nota de IA:**') ||
                                 /---+\s*\n\*\*Nota (?:do Autor|de IA):\*\*/i.test(text);
        
        if (hasExplicitIANote) {
            humanScore = Math.max(10, humanScore - 40);
        }
        
        // Auto-identificação como IA
        const hasSelfIdentification = /\b(?:como um modelo de IA|como uma inteligência artificial|sou um assistente AI)\b/i.test(text);
        if (hasSelfIdentification) {
            humanScore = Math.max(5, humanScore - 50);
        }
        
        // Perplexidade
        if (perplexityAnalysis.score < 20) {
            humanScore -= 25;
        } else if (perplexityAnalysis.score > 50) {
            humanScore += 20;
        }
        
        // Padrões de conclusão
        humanScore -= (conclusionAnalysis.score || 0) * 0.6;
        
        // Uso de negrito
        const boldCount = (text.match(/\*\*.*?\*\*/g) || []).length;
        if (boldCount > 12 && contentType !== 'academic') {
            humanScore -= Math.min(boldCount * 0.8, 20);
        }
        
        // Validação cruzada
        const crossValidation = crossValidateAnalysis(text, humanScore);
        humanScore = crossValidation.adjustedProbability || humanScore;
        
        // Limites finais
        const humanProbability = Math.max(5, Math.min(95, humanScore));
        const aiProbability = 100 - humanProbability;
        
        console.log('Probabilidades finais:', { humanProbability, aiProbability });
        
        // Confiança
        const confidence = calculateConfidence(
            humanProbability, 
            aiPatternAnalysis, 
            humanPatternAnalysis, 
            perplexityAnalysis
        );
        
        // Destaques no texto
        const textHighlights = generateTextHighlights(text, aiPatternAnalysis, humanPatternAnalysis);
        
        // Sugestões
        const suggestions = generateSuggestions(
            humanProbability, 
            aiPatternAnalysis, 
            humanPatternAnalysis, 
            text, 
            contentType
        );
        
        // Explicação detalhada
        const detailedExplanation = generateDetailedExplanation({
            humanProbability, 
            aiPatternScore: aiPatternAnalysis.normalizedScore,
            humanPatternScore: humanPatternAnalysis.normalizedScore,
            lexicalRichness,
            structuralPenalty,
            aiPatterns: aiPatternAnalysis.patterns,
            humanPatterns: humanPatternAnalysis.patterns,
            boldCount,
            hasExplicitIANote,
            perplexityScore: perplexityAnalysis.score,
            conclusionScore: conclusionAnalysis.score,
            contextType: contentType,
            contextDescription: adjustedScores.description,
            crossValidationDetails: crossValidation.details
        });
        
        // Resultado final
        const analysisResult = {
            humanProbability: humanProbability,
            aiProbability: aiProbability,
            analyzedText: text,
            wordCount: wordCount,
            sentenceCount: sentenceCount,
            paragraphCount: paragraphCount,
            contentType: contentType,
            confidence: confidence,
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
                crossValidationVariance: crossValidation.variance || 0
            },
            detailedMetrics: {
                aiPatternAnalysis: aiPatternAnalysis,
                humanPatternAnalysis: humanPatternAnalysis,
                perplexityAnalysis: perplexityAnalysis,
                conclusionAnalysis: conclusionAnalysis,
                crossValidation: crossValidation,
                contextAdjustment: adjustedScores
            },
            textHighlights: textHighlights,
            suggestions: suggestions,
            detailedExplanation: detailedExplanation
        };
        
        console.log('Análise concluída com sucesso');
        return analysisResult;
        
    } catch (error) {
        console.error('Erro fatal em advancedAnalyzeContent:', error);
        
        // Retornar resultado de fallback em caso de erro
        return {
            humanProbability: 50,
            aiProbability: 50,
            analyzedText: text,
            wordCount: text.split(/\s+/).length,
            sentenceCount: text.split(/[.!?]+/).length - 1,
            paragraphCount: text.split(/\n\s*\n/).length,
            contentType: contentType,
            confidence: 50,
            advancedMetrics: {
                aiPatternScore: 0,
                humanPatternScore: 0,
                lexicalRichness: 0,
                structuralPenalty: 0,
                boldCount: 0,
                strongAIPatterns: 0,
                strongHumanPatterns: 0,
                hasExplicitIANote: false,
                perplexityScore: 50,
                conclusionAIScore: 0,
                contextAdjustment: 0,
                crossValidationVariance: 0
            },
            suggestions: ['Análise concluída com limitações técnicas'],
            detailedExplanation: ['Análise básica devido a erro técnico']
        };
    }
}

// FUNÇÃO: Calcular confiança
function calculateConfidence(humanProb, aiPatternAnalysis, humanPatternAnalysis, perplexityAnalysis) {
    try {
        let confidence = 70;
        
        if (aiPatternAnalysis.normalizedScore > 50 || humanPatternAnalysis.normalizedScore > 50) {
            confidence += 15;
        }
        
        if (humanProb > 80 || humanProb < 20) {
            confidence += 10;
        }
        
        if (perplexityAnalysis.score < 20 || perplexityAnalysis.score > 50) {
            confidence += 5;
        }
        
        return Math.min(95, Math.max(30, confidence));
    } catch (error) {
        console.error('Erro em calculateConfidence:', error);
        return 70;
    }
}

// FUNÇÃO: Gerar destaques no texto
function generateTextHighlights(text, aiPatternAnalysis, humanPatternAnalysis) {
    try {
        const highlights = {
            aiPatterns: [],
            humanElements: []
        };

        // Padrões de IA
        aiPatternAnalysis.patterns.forEach(pattern => {
            if (pattern.examples && pattern.examples.length > 0) {
                pattern.examples.forEach(example => {
                    if (typeof example === 'string') {
                        const start = text.toLowerCase().indexOf(example.toLowerCase());
                        if (start !== -1) {
                            highlights.aiPatterns.push({
                                start: start,
                                end: start + example.length,
                                text: example,
                                description: pattern.description
                            });
                        }
                    }
                });
            }
        });

        // Padrões humanos
        humanPatternAnalysis.patterns.forEach(pattern => {
            if (pattern.examples && pattern.examples.length > 0) {
                pattern.examples.forEach(example => {
                    if (typeof example === 'string') {
                        const start = text.toLowerCase().indexOf(example.toLowerCase());
                        if (start !== -1) {
                            highlights.humanElements.push({
                                start: start,
                                end: start + example.length,
                                text: example,
                                description: pattern.description
                            });
                        }
                    }
                });
            }
        });

        return highlights;
    } catch (error) {
        console.error('Erro em generateTextHighlights:', error);
        return { aiPatterns: [], humanElements: [] };
    }
}

// FUNÇÃO: Gerar sugestões
function generateSuggestions(humanProb, aiPatternAnalysis, humanPatternAnalysis, text, contentType) {
    try {
        const suggestions = [];
        
        // Tipo de conteúdo
        suggestions.push(`📝 Modo de análise: ${contentType.toUpperCase()}`);
        
        if (contentType === 'academic') {
            suggestions.push('✅ Modo acadêmico ativo: tolerante com estruturas formais');
        } else if (contentType === 'creative') {
            suggestions.push('🎨 Modo criativo ativo: rigoroso com clichês e fórmulas');
        }
        
        // Probabilidade
        if (humanProb >= 80) {
            suggestions.push('✅ ALTA PROBABILIDADE DE CONTEÚDO HUMANO');
            suggestions.push('✓ Múltiplos padrões humanos identificados');
        } else if (humanProb >= 65) {
            suggestions.push('✅ PROVÁVEL CONTEÚDO HUMANO');
            suggestions.push('✓ Elementos humanos predominantes');
        } else if (humanProb >= 50) {
            suggestions.push('⚖️ CARACTERÍSTICAS MISTAS');
            suggestions.push('• Combinação de elementos humanos e de IA');
        } else if (humanProb >= 30) {
            suggestions.push('🤔 PROVÁVEL CONTEÚDO DE IA');
            suggestions.push('• Padrões de IA detectados');
        } else {
            suggestions.push('🚨 ALTA PROBABILIDADE DE IA GENERATIVA');
            suggestions.push('• Múltiplos indicadores de IA');
        }
        
        // Contagem de padrões
        if (humanPatternAnalysis.patterns.length > 0) {
            suggestions.push(`✓ ${humanPatternAnalysis.patterns.length} elementos humanos detectados`);
        }
        
        if (aiPatternAnalysis.patterns.length > 0) {
            suggestions.push(`• ${aiPatternAnalysis.patterns.length} padrões de IA detectados`);
        }
        
        // Uso de negrito
        const boldCount = (text.match(/\*\*.*?\*\*/g) || []).length;
        if (boldCount > 15) {
            suggestions.push('💡 Sugestão: Reduzir uso excessivo de negrito');
        }
        
        return suggestions;
    } catch (error) {
        console.error('Erro em generateSuggestions:', error);
        return ['Sugestões não disponíveis devido a erro técnico'];
    }
}

// FUNÇÃO: Gerar explicação detalhada
function generateDetailedExplanation(metrics) {
    try {
        const explanations = [];
        
        if (metrics.contextDescription) {
            explanations.push(`CONTEXTO: ${metrics.contextDescription}`);
        }
        
        if (metrics.hasExplicitIANote) {
            explanations.push('🚨 NOTA EXPLÍCITA DE IA DETECTADA');
        }
        
        if (metrics.aiPatternScore > 40) {
            explanations.push('FORTES INDÍCIOS DE IA: Múltiplos padrões detectados');
        } else if (metrics.aiPatternScore > 20) {
            explanations.push('INDÍCIOS DE IA: Alguns padrões presentes');
        }
        
        if (metrics.humanPatternScore > 35) {
            explanations.push('FORTES INDÍCIOS HUMANOS: Características genuínas');
        } else if (metrics.humanPatternScore > 20) {
            explanations.push('INDÍCIOS HUMANOS: Elementos de escrita natural');
        }
        
        if (metrics.perplexityScore > 45) {
            explanations.push('Alta variação lexical - forte indicador humano');
        } else if (metrics.perplexityScore < 25) {
            explanations.push('Baixa variação lexical - possível padronização automática');
        }
        
        if (metrics.conclusionScore > 20) {
            explanations.push('Padrões de conclusão característicos de IA detectados');
        }
        
        if (metrics.crossValidationDetails) {
            explanations.push(`VALIDAÇÃO: ${metrics.crossValidationDetails}`);
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
    } catch (error) {
        console.error('Erro em generateDetailedExplanation:', error);
        return ['Explicação detalhada não disponível'];
    }
}

// =============================================
// FUNÇÕES DE INTERFACE
// =============================================

// FUNÇÃO: Exibir resultados
function displayResults(result) {
    console.log('Exibindo resultados:', result);
    
    // VALIDAÇÃO CRÍTICA
    if (!result) {
        console.error('Resultado da análise está undefined');
        showAlert('Erro: Resultado da análise não disponível', 'error');
        return;
    }
    
    if (typeof result.humanProbability === 'undefined') {
        console.error('Propriedade humanProbability não encontrada:', result);
        showAlert('Erro: Não foi possível calcular a probabilidade', 'error');
        return;
    }
    
    try {
        // 1. Atualizar barra de probabilidade
        const humanProbBar = document.getElementById('humanProbabilityBar');
        const humanProbability = result.humanProbability || 50;
        humanProbBar.style.width = `${Math.max(0, Math.min(100, humanProbability))}%`;
        
        // 2. Atualizar textos de probabilidade
        updateProbabilityDisplay(result);
        
        // 3. Atualizar perplexidade
        if (result.detailedMetrics && result.detailedMetrics.perplexityAnalysis) {
            updatePerplexityDisplay(result);
        } else {
            document.getElementById('perplexityDisplay').style.display = 'none';
        }
        
        // 4. Atualizar métricas avançadas
        if (result.advancedMetrics) {
            updateAdvancedMetrics(result);
        }
        
        // 5. Atualizar detalhes da análise
        updateAnalysisDetails(result);
        
        // 6. Atualizar prévia do texto
        updateTextPreview(result);
        
        // 7. Atualizar sugestões
        if (result.suggestions && Array.isArray(result.suggestions)) {
            updateSuggestions(result);
        }
        
        // 8. Mostrar container de resultados
        document.getElementById('resultsContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao exibir resultados:', error);
        showAlert(`Erro ao exibir resultados: ${error.message}`, 'error');
    }
}

// FUNÇÃO: Atualizar display de probabilidade
function updateProbabilityDisplay(result) {
    try {
        const verdictText = document.getElementById('verdictText');
        const confidenceText = document.getElementById('confidenceText');
        const humanPercent = document.querySelector('.human-percent');
        const aiPercent = document.querySelector('.ai-percent');
        
        let verdict = '';
        let color = '';
        let confidenceClass = '';
        
        const humanProb = result.humanProbability || 50;
        
        if (humanProb >= 80) {
            verdict = 'ALTA PROBABILIDADE DE CONTEÚDO HUMANO';
            color = '#27ae60';
            confidenceClass = 'high-confidence';
        } else if (humanProb >= 65) {
            verdict = 'PROVÁVEL CONTEÚDO HUMANO';
            color = '#2ecc71';
            confidenceClass = 'medium-confidence';
        } else if (humanProb >= 50) {
            verdict = 'CARACTERÍSTICAS MISTAS';
            color = '#f39c12';
            confidenceClass = 'medium-confidence';
        } else if (humanProb >= 30) {
            verdict = 'PROVÁVEL CONTEÚDO DE IA';
            color = '#e74c3c';
            confidenceClass = 'medium-confidence';
        } else {
            verdict = 'ALTA PROBABILIDADE DE IA GENERATIVA';
            color = '#c0392b';
            confidenceClass = 'high-confidence';
        }
        
        // Atualizar elementos
        if (verdictText) verdictText.textContent = verdict;
        if (verdictText) verdictText.style.color = color;
        
        if (confidenceText) {
            confidenceText.textContent = `Confiança: ${result.confidence || 50}%`;
            confidenceText.className = `confidence ${confidenceClass}`;
        }
        
        if (humanPercent) {
            humanPercent.textContent = `Humano: ${humanProb}%`;
            humanPercent.style.color = '#27ae60';
        }
        
        if (aiPercent) {
            aiPercent.textContent = `IA: ${100 - humanProb}%`;
            aiPercent.style.color = '#e74c3c';
        }
    } catch (error) {
        console.error('Erro em updateProbabilityDisplay:', error);
    }
}

// FUNÇÃO: Atualizar display de perplexidade
function updatePerplexityDisplay(result) {
    try {
        const perplexityDisplay = document.getElementById('perplexityDisplay');
        const perplexityValue = document.getElementById('perplexityValue');
        const perplexityLabel = document.getElementById('perplexityLabel');
        
        if (!perplexityDisplay || !perplexityValue || !perplexityLabel) return;
        
        const perplexity = result.detailedMetrics.perplexityAnalysis;
        
        if (perplexity && perplexity.score !== undefined) {
            perplexityValue.textContent = `${Math.round(perplexity.score)}%`;
            perplexityLabel.textContent = perplexity.details || 'Análise de variação lexical';
            
            // Cor baseada no valor
            if (perplexity.score > 50) {
                perplexityValue.style.color = '#27ae60';
            } else if (perplexity.score > 30) {
                perplexityValue.style.color = '#f39c12';
            } else {
                perplexityValue.style.color = '#e74c3c';
            }
            
            perplexityDisplay.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro em updatePerplexityDisplay:', error);
    }
}

// FUNÇÃO: Atualizar métricas avançadas
function updateAdvancedMetrics(result) {
    try {
        const metricsContainer = document.getElementById('advancedMetrics');
        if (!metricsContainer) return;
        
        const metrics = result.advancedMetrics || {};
        
        const metricCards = [
            {
                title: 'Elementos Humanos',
                value: `${metrics.humanPatternScore || 0}%`,
                type: (metrics.humanPatternScore || 0) >= 25 ? 'good' : 
                      (metrics.humanPatternScore || 0) >= 15 ? 'warning' : 'bad',
                label: (metrics.humanPatternScore || 0) >= 25 ? 'Alto' : 
                       (metrics.humanPatternScore || 0) >= 15 ? 'Moderado' : 'Baixo'
            },
            {
                title: 'Padrões IA',
                value: `${metrics.aiPatternScore || 0}%`,
                type: (metrics.aiPatternScore || 0) >= 35 ? 'bad' : 
                      (metrics.aiPatternScore || 0) >= 20 ? 'warning' : 'good',
                label: (metrics.aiPatternScore || 0) >= 35 ? 'Alto' : 
                       (metrics.aiPatternScore || 0) >= 20 ? 'Moderado' : 'Baixo'
            },
            {
                title: 'Riqueza Lexical',
                value: `${metrics.lexicalRichness || 0}%`,
                type: (metrics.lexicalRichness || 0) >= 35 ? 'good' : 
                      (metrics.lexicalRichness || 0) >= 25 ? 'warning' : 'bad',
                label: (metrics.lexicalRichness || 0) >= 35 ? 'Alta' : 
                       (metrics.lexicalRichness || 0) >= 25 ? 'Média' : 'Baixa'
            },
            {
                title: 'Variação Estrutural',
                value: `${metrics.perplexityScore || 0}%`,
                type: (metrics.perplexityScore || 0) >= 45 ? 'good' : 
                      (metrics.perplexityScore || 0) >= 25 ? 'warning' : 'bad',
                label: (metrics.perplexityScore || 0) >= 45 ? 'Alta' : 
                       (metrics.perplexityScore || 0) >= 25 ? 'Média' : 'Baixa'
            },
            {
                title: 'Uso de Negrito',
                value: metrics.boldCount || 0,
                type: (metrics.boldCount || 0) >= 12 ? 'bad' : 
                      (metrics.boldCount || 0) >= 8 ? 'warning' : 'good',
                label: (metrics.boldCount || 0) >= 12 ? 'Alto' : 
                       (metrics.boldCount || 0) >= 8 ? 'Moderado' : 'Normal'
            },
            {
                title: 'Nota IA Explícita',
                value: metrics.hasExplicitIANote ? 'SIM' : 'Não',
                type: metrics.hasExplicitIANote ? 'bad' : 'good',
                label: metrics.hasExplicitIANote ? 'Detectada' : 'Não detectada'
            }
        ];
        
        metricsContainer.innerHTML = metricCards.map(card => `
            <div class="metric-card ${card.type === 'good' ? 'metric-good' : card.type === 'warning' ? 'metric-warning' : 'metric-bad'}">
                <div class="metric-card-title">${card.title}</div>
                <div class="metric-value">${card.value}</div>
                <div class="metric-label">${card.label}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro em updateAdvancedMetrics:', error);
    }
}

// FUNÇÃO: Atualizar detalhes da análise
function updateAnalysisDetails(result) {
    try {
        const detailsContainer = document.getElementById('analysisDetails');
        if (!detailsContainer) return;
        
        const details = `
            <div class="detail-item">
                <strong>Tipo de Conteúdo Analisado:</strong>
                <span>${result.contentType || 'Não especificado'}</span>
            </div>
            <div class="detail-item">
                <strong>Estatísticas do Texto:</strong>
                <span>${result.wordCount || 0} palavras, ${result.sentenceCount || 0} sentenças, ${result.paragraphCount || 0} parágrafos</span>
            </div>
            <div class="detail-item">
                <strong>Elementos Humanos Detectados:</strong>
                <span>${(result.detailedMetrics?.humanPatternAnalysis?.patterns?.length || 0)} padrões</span>
            </div>
            <div class="detail-item">
                <strong>Padrões de IA Detectados:</strong>
                <span>${(result.detailedMetrics?.aiPatternAnalysis?.patterns?.length || 0)} padrões</span>
            </div>
            <div class="detail-item">
                <strong>Riqueza Lexical:</strong>
                <span>${result.advancedMetrics?.lexicalRichness || 0}%</span>
            </div>
            <div class="detail-item">
                <strong>Confiança da Análise:</strong>
                <span>${result.confidence || 50}%</span>
            </div>
        `;
        
        detailsContainer.innerHTML = details;
    } catch (error) {
        console.error('Erro em updateAnalysisDetails:', error);
    }
}

// FUNÇÃO: Atualizar prévia do texto
function updateTextPreview(result) {
    try {
        const textPreview = document.getElementById('textPreview');
        if (!textPreview) return;
        
        if (!result.analyzedText || result.analyzedText.trim().length === 0) {
            textPreview.innerHTML = '<p class="placeholder">Nenhum texto disponível para exibição.</p>';
            return;
        }
        
        let highlightedText = result.analyzedText;
        
        // Aplicar destaques se disponíveis
        if (result.textHighlights) {
            const allHighlights = [
                ...(result.textHighlights.aiPatterns || []).map(h => ({...h, type: 'ai'})),
                ...(result.textHighlights.humanElements || []).map(h => ({...h, type: 'human'}))
            ].sort((a, b) => b.start - a.start);
            
            allHighlights.forEach(highlight => {
                if (highlight.start >= 0 && highlight.end <= highlightedText.length) {
                    const before = highlightedText.substring(0, highlight.start);
                    const target = highlightedText.substring(highlight.start, highlight.end);
                    const after = highlightedText.substring(highlight.end);
                    
                    if (highlight.type === 'ai') {
                        highlightedText = before + 
                            `<span class="highlight-ai">${target}</span>` + 
                            after;
                    } else {
                        highlightedText = before + 
                            `<span class="highlight-human">${target}</span>` + 
                            after;
                    }
                }
            });
        }
        
        // Limitar texto muito longo
        if (highlightedText.length > 3000) {
            highlightedText = highlightedText.substring(0, 3000) + '... [texto truncado]';
        }
        
        textPreview.innerHTML = highlightedText;
    } catch (error) {
        console.error('Erro em updateTextPreview:', error);
    }
}

// FUNÇÃO: Atualizar sugestões
function updateSuggestions(result) {
    try {
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList || !result.suggestions) return;
        
        suggestionsList.innerHTML = result.suggestions
            .map(suggestion => `<li>${suggestion}</li>`)
            .join('');
    } catch (error) {
        console.error('Erro em updateSuggestions:', error);
    }
}

// =============================================
// FUNÇÕES DE MANIPULAÇÃO DE ARQUIVOS
// =============================================

// FUNÇÃO: Extrair texto de arquivos
async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                let text = '';
                
                switch (fileExtension) {
                    case 'txt':
                        text = e.target.result;
                        break;
                        
                    case 'pdf':
                        if (typeof pdfjsLib === 'undefined') {
                            throw new Error('Biblioteca PDF.js não disponível');
                        }
                        text = await extractTextFromPDF(e.target.result);
                        break;
                        
                    case 'docx':
                    case 'doc':
                        if (typeof mammoth === 'undefined') {
                            throw new Error('Biblioteca Mammoth não disponível');
                        }
                        text = await extractTextFromDOCX(e.target.result);
                        break;
                        
                    default:
                        reject(new Error(`Formato ${fileExtension} não suportado`));
                        return;
                }
                
                resolve(text);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

// FUNÇÃO: Extrair texto de PDF
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
        console.error('Erro ao extrair texto do PDF:', error);
        throw new Error(`Erro ao processar PDF: ${error.message}`);
    }
}

// FUNÇÃO: Extrair texto de DOCX/DOC
async function extractTextFromDOCX(arrayBuffer) {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Erro ao extrair texto do documento:', error);
        throw new Error(`Erro ao processar documento: ${error.message}`);
    }
}

// =============================================
// FUNÇÕES DE ALERTA E INTERFACE
// =============================================

// FUNÇÃO: Mostrar alerta
function showAlert(message, type = 'info') {
    try {
        // Remover alertas anteriores
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        // Ícones por tipo
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        // Cores por tipo
        const colors = {
            success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
            error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
            info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' },
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404' }
        };
        
        const color = colors[type] || colors.info;
        const icon = icons[type] || icons.info;
        
        // Criar alerta
        const alert = document.createElement('div');
        alert.className = 'alert-message';
        alert.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="alert-close"><i class="fas fa-times"></i></button>
        `;
        
        // Estilos
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${color.bg};
            color: ${color.text};
            border-left: 4px solid ${color.border};
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 400px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        // Botão de fechar
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
            display: flex;
            align-items: center;
        `;
        
        closeBtn.addEventListener('click', () => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        });
        
        document.body.appendChild(alert);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
        
        // Adicionar animações CSS se não existirem
        if (!document.getElementById('alert-styles')) {
            const style = document.createElement('style');
            style.id = 'alert-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    } catch (error) {
        console.error('Erro ao mostrar alerta:', error);
    }
}

// FUNÇÃO: Formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicação iniciada...');
    
    // ELEMENTOS DA INTERFACE
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        textInput: document.getElementById('textInput'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        clearBtn: document.getElementById('clearBtn'),
        loading: document.getElementById('loading'),
        resultsContainer: document.getElementById('resultsContainer'),
        downloadPdfBtn: document.getElementById('downloadPdfBtn'),
        contextIndicator: document.getElementById('contextIndicator'),
        contentType: document.getElementById('contentType')
    };
    
    // INICIALIZAÇÃO
    initializeApplication();
    
    function initializeApplication() {
        console.log('Inicializando aplicação...');
        
        // Verificar bibliotecas
        checkLibraries();
        
        // Configurar eventos
        setupEventListeners();
        
        // Configurar indicador de contexto
        updateContextIndicator();
        
        console.log('Aplicação inicializada com sucesso');
    }
    
    function checkLibraries() {
        console.log('Verificando bibliotecas...');
        
        const libraries = {
            'pdfjsLib': typeof pdfjsLib,
            'mammoth': typeof mammoth,
            'jsPDF': typeof jsPDF
        };
        
        console.log('Status das bibliotecas:', libraries);
        
        // Verificar bibliotecas críticas
        if (typeof pdfjsLib === 'undefined') {
            console.warn('PDF.js não carregada - funcionalidade de PDF limitada');
        }
        
        if (typeof mammoth === 'undefined') {
            console.warn('Mammoth não carregada - funcionalidade de DOCX limitada');
        }
    }
    
    function setupEventListeners() {
        console.log('Configurando eventos...');
        
        // Upload de arquivo
        if (elements.uploadArea) {
            elements.uploadArea.addEventListener('click', () => {
                if (elements.fileInput) elements.fileInput.click();
            });
            
            elements.uploadArea.addEventListener('dragover', handleDragOver);
            elements.uploadArea.addEventListener('drop', handleFileDrop);
        }
        
        // Input de arquivo
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileInputChange);
        }
        
        // Tipo de conteúdo
        if (elements.contentType) {
            elements.contentType.addEventListener('change', updateContextIndicator);
        }
        
        // Botões principais
        if (elements.analyzeBtn) {
            elements.analyzeBtn.addEventListener('click', startAnalysis);
        }
        
        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', clearAll);
        }
        
        if (elements.downloadPdfBtn) {
            elements.downloadPdfBtn.addEventListener('click', generateDetailedPDF);
        }
        
        // Textarea - auto-expand
        if (elements.textInput) {
            elements.textInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        console.log('Eventos configurados');
    }
    
    function updateContextIndicator() {
        try {
            if (!elements.contextIndicator || !elements.contentType) return;
            
            const type = elements.contentType.value;
            const descriptions = {
                academic: "🎓 Modo Acadêmico: Tolerante com formalidade",
                technical: "🔧 Modo Técnico: Análise equilibrada",
                creative: "🎨 Modo Criativo: Rigoroso com clichês",
                business: "💼 Modo Negócios: Foco em objetividade",
                casual: "😊 Modo Casual: Detecção mais sensível"
            };
            
            elements.contextIndicator.innerHTML = `
                <i class="fas fa-info-circle"></i> ${descriptions[type] || "Modo padrão"}
            `;
        } catch (error) {
            console.error('Erro em updateContextIndicator:', error);
        }
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        if (elements.uploadArea) {
            elements.uploadArea.style.background = 'linear-gradient(135deg, #e0e7ff, #d6e0ff)';
        }
    }
    
    function handleFileDrop(e) {
        e.preventDefault();
        if (elements.uploadArea) {
            elements.uploadArea.style.background = 'linear-gradient(135deg, #f8f9ff, #eef2ff)';
        }
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && elements.fileInput) {
            elements.fileInput.files = files;
            handleFileSelection(files[0]);
        }
    }
    
    function handleFileInputChange(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    }
    
    function handleFileSelection(file) {
        try {
            if (!file || !elements.uploadArea) return;
            
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            // Validar tipo de arquivo
            const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
            if (!validExtensions.includes(fileExtension)) {
                showAlert('Tipo de arquivo não suportado. Use PDF, DOCX, DOC ou TXT.', 'error');
                return;
            }
            
            // Limpar textarea se houver arquivo
            if (elements.textInput) {
                elements.textInput.value = '';
            }
            
            // Atualizar interface
            elements.uploadArea.innerHTML = `
                <i class="fas fa-file-check fa-3x" style="color: #27ae60;"></i>
                <h3>Arquivo selecionado:</h3>
                <p><strong>${fileName}</strong></p>
                <p class="file-types">Clique em "Analisar Conteúdo" para continuar</p>
                <div class="file-info">
                    <small>Tipo: ${fileExtension.toUpperCase()} | Tamanho: ${formatFileSize(file.size)}</small>
                </div>
            `;
            
            showAlert(`Arquivo "${fileName}" selecionado com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro em handleFileSelection:', error);
            showAlert('Erro ao processar arquivo', 'error');
        }
    }
    
    // FUNÇÃO PRINCIPAL DE ANÁLISE
    async function startAnalysis() {
        console.log('Iniciando análise...');
        
        const file = elements.fileInput?.files[0];
        const text = elements.textInput?.value.trim() || '';
        const contentType = elements.contentType?.value || 'academic';
        
        console.log('Parâmetros:', { 
            hasFile: !!file, 
            textLength: text.length, 
            contentType 
        });
        
        // Validação
        if (!file && !text) {
            showAlert('Por favor, selecione um arquivo ou cole um texto para análise.', 'error');
            return;
        }
        
        if (text && text.length < 50) {
            showAlert('Texto muito curto. Forneça um texto com pelo menos 50 caracteres.', 'error');
            return;
        }
        
        // Mostrar loading
        if (elements.loading) {
            elements.loading.style.display = 'block';
        }
        
        if (elements.resultsContainer) {
            elements.resultsContainer.style.display = 'none';
        }
        
        try {
            let content = '';
            
            // Extrair conteúdo
            if (file) {
                console.log('Processando arquivo:', file.name);
                showAlert(`Processando arquivo: ${file.name}...`, 'info');
                content = await extractTextFromFile(file);
            } else {
                content = text;
            }
            
            console.log('Conteúdo extraído (tamanho):', content.length);
            
            // Validar conteúdo
            if (!content || content.trim().length < 50) {
                throw new Error('Conteúdo muito curto ou vazio após processamento.');
            }
            
            // Realizar análise
            showAlert('Analisando conteúdo com algoritmo avançado...', 'info');
            console.log('Chamando advancedAnalyzeContent...');
            
            const analysisResult = await advancedAnalyzeContent(content, contentType);
            
            // Verificar resultado
            if (!analysisResult) {
                throw new Error('A análise não retornou resultados.');
            }
            
            console.log('Análise concluída, exibindo resultados...');
            
            // Armazenar e exibir resultados
            currentAnalysisResult = analysisResult;
            displayResults(analysisResult);
            showAlert('Análise concluída com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro na análise:', error);
            showAlert(`Erro na análise: ${error.message}`, 'error');
            
            // Mostrar fallback
            const fallbackResult = {
                humanProbability: 50,
                aiProbability: 50,
                analyzedText: text || 'Texto não disponível',
                wordCount: text.split(/\s+/).length,
                sentenceCount: text.split(/[.!?]+/).length - 1,
                paragraphCount: text.split(/\n\s*\n/).length,
                contentType: contentType,
                confidence: 50,
                suggestions: ['Análise básica devido a erro técnico'],
                detailedExplanation: ['Use um texto mais longo para análise mais precisa']
            };
            
            displayResults(fallbackResult);
        } finally {
            if (elements.loading) {
                elements.loading.style.display = 'none';
            }
        }
    }
    
    // FUNÇÃO: Limpar tudo
    function clearAll() {
        console.log('Limpando tudo...');
        
        try {
            // Resetar inputs
            if (elements.fileInput) elements.fileInput.value = '';
            if (elements.textInput) {
                elements.textInput.value = '';
                elements.textInput.style.height = 'auto';
            }
            
            // Resetar upload area
            if (elements.uploadArea) {
                elements.uploadArea.innerHTML = `
                    <i class="fas fa-file-upload fa-3x"></i>
                    <h3>Arraste e solte arquivos aqui</h3>
                    <p>ou clique para selecionar</p>
                    <p class="file-types">Formatos suportados: PDF, DOCX, DOC, TXT</p>
                    <input type="file" id="fileInput" class="file-input" accept=".pdf,.docx,.doc,.txt">
                `;
            }
            
            // Resetar resultados
            if (elements.resultsContainer) {
                elements.resultsContainer.style.display = 'none';
            }
            
            const perplexityDisplay = document.getElementById('perplexityDisplay');
            if (perplexityDisplay) {
                perplexityDisplay.style.display = 'none';
            }
            
            // Resetar barra de probabilidade
            const humanProbBar = document.getElementById('humanProbabilityBar');
            if (humanProbBar) {
                humanProbBar.style.width = '50%';
            }
            
            // Resetar textos
            const verdictText = document.getElementById('verdictText');
            const confidenceText = document.getElementById('confidenceText');
            const humanPercent = document.querySelector('.human-percent');
            const aiPercent = document.querySelector('.ai-percent');
            
            if (verdictText) {
                verdictText.textContent = 'Carregando análise...';
                verdictText.style.color = '';
            }
            
            if (confidenceText) {
                confidenceText.textContent = 'Confiança: 0%';
                confidenceText.className = 'confidence';
            }
            
            if (humanPercent) {
                humanPercent.textContent = 'Humano: 0%';
            }
            
            if (aiPercent) {
                aiPercent.textContent = 'IA: 0%';
            }
            
            // Resetar métricas
            const advancedMetrics = document.getElementById('advancedMetrics');
            const analysisDetails = document.getElementById('analysisDetails');
            const textPreview = document.getElementById('textPreview');
            const suggestionsList = document.getElementById('suggestionsList');
            
            if (advancedMetrics) advancedMetrics.innerHTML = '';
            if (analysisDetails) analysisDetails.innerHTML = '';
            if (textPreview) {
                textPreview.innerHTML = '<p class="placeholder">Nenhum texto para exibir. Faça uma análise primeiro.</p>';
            }
            if (suggestionsList) {
                suggestionsList.innerHTML = '<li>Selecione ou cole um texto para análise</li>';
            }
            
            // Limpar resultado atual
            currentAnalysisResult = null;
            
            showAlert('Tudo limpo! Pronto para nova análise.', 'success');
            console.log('Limpeza concluída');
            
        } catch (error) {
            console.error('Erro em clearAll:', error);
            showAlert('Erro ao limpar a aplicação', 'error');
        }
    }
    
    // FUNÇÃO: Gerar PDF
    function generateDetailedPDF() {
        if (!currentAnalysisResult) {
            showAlert('Nenhum resultado disponível para gerar PDF.', 'error');
            return;
        }
        
        try {
            if (typeof jsPDF !== 'undefined') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Cabeçalho
                doc.setFontSize(20);
                doc.setTextColor(102, 126, 234);
                doc.text('Relatório de Análise de Conteúdo', 20, 20);
                
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 30);
                doc.text(`Tipo: ${currentAnalysisResult.contentType}`, 20, 40);
                
                // Probabilidade
                doc.setFontSize(16);
                doc.text('Probabilidade de Autoria:', 20, 60);
                doc.setFontSize(14);
                doc.text(`Humano: ${currentAnalysisResult.humanProbability}%`, 20, 70);
                doc.text(`IA: ${currentAnalysisResult.aiProbability}%`, 20, 80);
                
                // Métricas
                doc.setFontSize(16);
                doc.text('Métricas Avançadas:', 20, 100);
                doc.setFontSize(12);
                
                let yPos = 110;
                const metrics = currentAnalysisResult.advancedMetrics || {};
                
                Object.entries(metrics).forEach(([key, value]) => {
                    if (typeof value !== 'object') {
                        doc.text(`${key}: ${value}`, 20, yPos);
                        yPos += 10;
                    }
                });
                
                // Salvar
                doc.save(`analise-ia-${Date.now()}.pdf`);
                showAlert('PDF gerado com sucesso!', 'success');
                
            } else {
                showAlert('Biblioteca PDF não disponível. Use a versão online.', 'error');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            showAlert('Erro ao gerar PDF. Tente novamente.', 'error');
        }
    }
    
    // Inicialização completa
    console.log('Script carregado com sucesso');
});
