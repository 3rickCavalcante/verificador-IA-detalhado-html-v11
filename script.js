// =============================================
// DETECTOR ACADÊMICO DE IA - SCRIPT COMPLETO
// Versão 2.0 - Especializada para contexto educacional
// =============================================

// CONFIGURAÇÕES GLOBAIS
let currentAnalysisResult = null;
let analysisHistory = [];

// PADRÕES ESPECÍFICOS PARA DETECÇÃO ACADÊMICA
const academicAIPatterns = [
    // 1. SOBREPOSIÇÃO DE REFERÊNCIAS EXCESSIVA
    {
        pattern: /(?:[A-ZÀ-ÿ][a-zà-ÿ]+(?: et al\.|, [A-ZÀ-ÿ]\.){1,3}(?:\s*\(\d{4}\)[^;]{0,50}){3,})/g,
        weight: 30,
        description: "Acúmulo excessivo de citações em sequência"
    },
    
    // 2. METALINGUAGEM ACADÊMICA GENÉRICA
    {
        pattern: /\b(?:importante ressaltar|cabe destacar|vale mencionar|convém observar)\b[^.!?]{0,100}\b(?:que|o fato de|a importância)\b/gi,
        weight: 25,
        description: "Fórmulas retóricas vazias típicas de IA"
    },
    
    // 3. TRANSICÕES PERFEITAS DEMASIADO
    {
        pattern: /\.\s*(?:Ademais|Além disso|Por outro lado|Contudo|Todavia)\b[^.!?]{20,80}\.\s*(?:No entanto|Entretanto|Assim sendo)\b/gi,
        weight: 28,
        description: "Encadeamento excessivamente lógico"
    },
    
    // 4. EQUILÍBRIO ARTIFICIAL DE ARGUMENTOS
    {
        pattern: /Por um lado[^.!?]{50,150}Por outro lado[^.!?]{50,150}Dessa forma/gi,
        weight: 32,
        description: "Estrutura dialética artificialmente balanceada"
    },
    
    // 5. CITAÇÕES SEM CONTEXTUALIZAÇÃO
    {
        pattern: /"[^"]{20,100}"\s*(?:\([^)]{10,50}\)\.)(?:\s*[A-ZÀ-ÿ]){1,3}[^.!?]{50,150}\."[^"]{20,100}"/g,
        weight: 35,
        description: "Citações encadeadas sem análise pessoal"
    },
    
    // 6. LINGUAGEM PERFEITAMENTE CONSISTENTE
    {
        pattern: /\b(\w{8,})\b[^.!?]{100,300}\b\1\b[^.!?]{100,300}\b\1\b/gi,
        weight: -40,
        description: "Repetição vocabular (indica humano)"
    },
    
    // 7. MARCAS DE REVISÃO HUMANA
    {
        pattern: /(?:\(sic\)|\[grifo nosso\]|\[itálico do autor\]|nota do autor:|como veremos mais adiante)/gi,
        weight: -50,
        description: "Marcas editoriais humanas"
    },
    
    // 8. INCONSISTÊNCIAS DE FORMATAÇÃO
    {
        pattern: /(?:\(\w+,\s*\d{4}[a-z]?\)|\(\w+\s+\d{4}\))/g,
        weight: -25,
        description: "Variações na formatação (humano)"
    },
    
    // 9. EXPERIÊNCIAS PESSOAIS
    {
        pattern: /\b(?:em minha experiência|na prática docente|observamos em sala|durante a pesquisa)/gi,
        weight: -60,
        description: "Experiências pessoais - forte indicador humano"
    },
    
    // 10. DÚVIDAS E INCERTEZAS
    {
        pattern: /\b(?:talvez|provavelmente|possivelmente|parece que|aparentemente|não está claro)/gi,
        weight: -30,
        description: "Expressões de incerteza acadêmica"
    }
];

// FUNÇÕES DE ANÁLISE ACADÊMICA
function calculateCitationDensity(text) {
    const words = text.split(/\s+/).length;
    const citations = (text.match(/\([A-ZÀ-ÿ][^)]*\d{4}[^)]*\)/g) || []).length;
    return words > 0 ? (citations / (words / 1000)) : 0;
}

function analyzePersonalVoice(text) {
    let score = 0;
    
    const firstPerson = (text.match(/\b(?:eu|nós|minha|nossa|meu|nosso)\b/gi) || []).length;
    score += Math.min(firstPerson * 3, 30);
    
    const personalExp = (text.match(/\b(?:experiência|prática|observação|pesquisa|estudo)\s+(?:pessoal|própria|realizada)/gi) || []).length;
    score += personalExp * 8;
    
    const reflections = (text.match(/\b(?:questiono|pergunto|refiro|parece-me|ao meu ver)\b/gi) || []).length;
    score += reflections * 5;
    
    return Math.min(score, 100);
}

function calculatePerfectionScore(text) {
    let score = 0;
    
    const sections = text.split(/\n\s*\n/);
    if (sections.length >= 5) {
        const headingPattern = /^(?:[0-9]+\.\s+|[A-Z][A-Z\s]{5,})/gm;
        const headings = text.match(headingPattern) || [];
        if (headings.length / sections.length > 0.7) {
            score += 20;
        }
    }
    
    const transitions = text.match(/\b(?:portanto|assim|logo|pois|contudo|entretanto|no entanto)\b/gi) || [];
    if (transitions.length > (text.length / 500)) {
        score += 15;
    }
    
    const complexWords = text.match(/\b[a-zA-ZÀ-ÿ]{10,}\b/g) || [];
    const totalWords = text.split(/\s+/).length;
    if (complexWords.length / totalWords > 0.15) {
        score += 25;
    }
    
    return score;
}

function detectAcademicAIPatterns(text) {
    let totalScore = 0;
    
    academicAIPatterns.forEach(patternObj => {
        try {
            const matches = text.match(patternObj.pattern) || [];
            if (matches.length > 0) {
                const score = patternObj.weight < 0 ? 
                    Math.max(-100, matches.length * patternObj.weight) : 
                    Math.min(matches.length * patternObj.weight, 100);
                
                totalScore += score;
            }
        } catch (error) {
            console.warn('Erro ao processar padrão:', error);
        }
    });
    
    return Math.min(100, Math.max(-100, totalScore / 3));
}

function calculateComplexity(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    let totalWords = 0;
    let complexWords = 0;
    
    sentences.forEach(sentence => {
        const words = sentence.split(/\s+/);
        totalWords += words.length;
        
        words.forEach(word => {
            if (word.length >= 8 && /[a-zA-ZÀ-ÿ]/.test(word)) {
                complexWords++;
            }
        });
    });
    
    return totalWords > 0 ? Math.round((complexWords / totalWords) * 100) : 0;
}

// ALGORITMO PRINCIPAL DE ANÁLISE ACADÊMICA
async function analyzeAcademicText(text, academicLevel, subjectArea) {
    console.log('Iniciando análise acadêmica para nível:', academicLevel);
    
    // Configurações por nível
    const levelConfig = {
        undergrad: {
            maxCitationDensity: 3,
            expectedComplexity: 40,
            personalVoiceWeight: 1.2,
            perfectionThreshold: 30
        },
        masters: {
            maxCitationDensity: 5,
            expectedComplexity: 60,
            personalVoiceWeight: 1.0,
            perfectionThreshold: 40
        },
        doctoral: {
            maxCitationDensity: 8,
            expectedComplexity: 80,
            personalVoiceWeight: 0.8,
            perfectionThreshold: 50
        },
        researcher: {
            maxCitationDensity: 10,
            expectedComplexity: 90,
            personalVoiceWeight: 0.6,
            perfectionThreshold: 60
        }
    };
    
    const config = levelConfig[academicLevel] || levelConfig.masters;
    
    try {
        // Cálculo de métricas básicas
        const wordCount = text.split(/\s+/).length;
        const sentenceCount = text.split(/[.!?]+/).length - 1;
        const paragraphCount = text.split(/\n\s*\n/).length;
        
        // Métricas avançadas
        const citationDensity = calculateCitationDensity(text);
        const personalVoiceScore = analyzePersonalVoice(text);
        const complexityScore = calculateComplexity(text);
        const perfectionScore = calculatePerfectionScore(text);
        const aiPatternScore = detectAcademicAIPatterns(text);
        
        // Cálculo da probabilidade (base acadêmica)
        let humanProbability = 70; // Base mais alta para benefício da dúvida
        
        // Ajustes baseados em métricas
        const citationDeviation = Math.max(0, citationDensity - config.maxCitationDensity);
        humanProbability -= citationDeviation * 5;
        
        const complexityDeviation = Math.abs(complexityScore - config.expectedComplexity);
        humanProbability -= complexityDeviation * 0.7;
        
        humanProbability += (personalVoiceScore * config.personalVoiceWeight * 0.3);
        
        humanProbability -= (aiPatternScore > 0 ? aiPatternScore * 0.8 : 0);
        
        const perfectionPenalty = Math.max(0, perfectionScore - config.perfectionThreshold);
        humanProbability -= perfectionPenalty * 0.6;
        
        // Limites finais
        humanProbability = Math.max(10, Math.min(95, humanProbability));
        const aiProbability = 100 - humanProbability;
        
        // Cálculo de confiança
        const confidence = calculateAcademicConfidence(
            humanProbability,
            citationDensity,
            personalVoiceScore,
            complexityDeviation,
            aiPatternScore
        );
        
        // Gerar alertas acadêmicos
        const academicAlerts = generateAcademicAlerts(
            text,
            academicLevel,
            config,
            citationDensity,
            complexityScore,
            personalVoiceScore,
            perfectionScore,
            aiPatternScore
        );
        
        // Gerar métricas para display
        const advancedMetrics = generateAdvancedMetrics({
            citationDensity,
            personalVoiceScore,
            complexityScore,
            perfectionScore,
            aiPatternScore,
            wordCount,
            sentenceCount,
            paragraphCount
        });
        
        // Gerar recomendações
        const recommendations = generateRecommendations(
            humanProbability,
            academicAlerts,
            academicLevel
        );
        
        return {
            humanProbability,
            aiProbability,
            confidence,
            analyzedText: text,
            academicLevel,
            subjectArea,
            wordCount,
            sentenceCount,
            paragraphCount,
            advancedMetrics,
            academicAlerts,
            recommendations,
            detailedAnalysis: {
                citationDensity,
                personalVoiceScore,
                complexityScore,
                perfectionScore,
                aiPatternScore,
                citationDeviation,
                complexityDeviation
            }
        };
        
    } catch (error) {
        console.error('Erro na análise acadêmica:', error);
        throw new Error(`Falha na análise: ${error.message}`);
    }
}

function calculateAcademicConfidence(humanProb, citationDensity, personalVoice, complexityDev, aiPatternScore) {
    let confidence = 70;
    
    if (citationDensity > 10 || personalVoice > 50) confidence += 10;
    if (complexityDev < 20) confidence += 8;
    if (aiPatternScore > 30) confidence += 12;
    if (humanProb > 80 || humanProb < 30) confidence += 5;
    
    return Math.min(95, Math.max(50, confidence));
}

function generateAcademicAlerts(text, level, config, citationDensity, complexity, personalVoice, perfection, aiPatterns) {
    const alerts = [];
    
    // Alertas de citação
    if (citationDensity > config.maxCitationDensity * 1.5) {
        alerts.push({
            type: 'warning',
            icon: 'fa-quote-right',
            title: 'Densidade de Citações Elevada',
            message: `${citationDensity.toFixed(1)} citações por 1000 palavras (esperado: ${config.maxCitationDensity})`,
            severity: citationDensity > config.maxCitationDensity * 2 ? 'high' : 'medium'
        });
    }
    
    // Alertas de complexidade
    if (complexity > config.expectedComplexity + 25) {
        alerts.push({
            type: 'warning',
            icon: 'fa-brain',
            title: 'Complexidade Incompatível',
            message: `Complexidade lexical: ${complexity}% (esperado: ${config.expectedComplexity}%)`,
            severity: 'high'
        });
    } else if (complexity < config.expectedComplexity - 20) {
        alerts.push({
            type: 'info',
            icon: 'fa-brain',
            title: 'Complexidade Abaixo do Esperado',
            message: `Complexidade lexical: ${complexity}% (esperado: ${config.expectedComplexity}%)`,
            severity: 'low'
        });
    }
    
    // Alertas de voz pessoal
    if (personalVoice < 20 && level === 'undergrad') {
        alerts.push({
            type: 'warning',
            icon: 'fa-user',
            title: 'Pouca Voz Pessoal',
            message: `Voz pessoal: ${personalVoice}% (espera-se mais posicionamento próprio)`,
            severity: 'medium'
        });
    }
    
    // Alertas de perfeição
    if (perfection > config.perfectionThreshold + 20) {
        alerts.push({
            type: 'danger',
            icon: 'fa-star',
            title: 'Estrutura Excessivamente Perfeita',
            message: 'Padrão comum em textos gerados por IA',
            severity: 'high'
        });
    }
    
    // Alertas de padrões de IA
    if (aiPatterns > 40) {
        alerts.push({
            type: 'danger',
            icon: 'fa-robot',
            title: 'Padrões de IA Detectados',
            message: 'Múltiplos padrões característicos de textos gerados por IA',
            severity: 'high'
        });
    }
    
    // Bônus para características humanas
    if (personalVoice > 60) {
        alerts.push({
            type: 'success',
            icon: 'fa-user-check',
            title: 'Forte Voz Pessoal Detectada',
            message: 'Bom indicador de autoria humana',
            severity: 'low'
        });
    }
    
    return alerts;
}

function generateAdvancedMetrics(data) {
    return [
        {
            title: 'Densidade de Citações',
            value: `${data.citationDensity.toFixed(1)}/1000`,
            type: data.citationDensity > 8 ? 'danger' : data.citationDensity > 5 ? 'warning' : 'good',
            label: data.citationDensity > 8 ? 'Alta' : data.citationDensity > 5 ? 'Moderada' : 'Normal'
        },
        {
            title: 'Voz Pessoal',
            value: `${data.personalVoiceScore}%`,
            type: data.personalVoiceScore > 60 ? 'good' : data.personalVoiceScore > 30 ? 'warning' : 'danger',
            label: data.personalVoiceScore > 60 ? 'Forte' : data.personalVoiceScore > 30 ? 'Moderada' : 'Fraca'
        },
        {
            title: 'Complexidade',
            value: `${data.complexityScore}%`,
            type: data.complexityScore > 80 ? 'danger' : data.complexityScore > 50 ? 'warning' : 'good',
            label: data.complexityScore > 80 ? 'Alta' : data.complexityScore > 50 ? 'Média' : 'Baixa'
        },
        {
            title: 'Perfeição Estrutural',
            value: `${data.perfectionScore}%`,
            type: data.perfectionScore > 60 ? 'danger' : data.perfectionScore > 40 ? 'warning' : 'good',
            label: data.perfectionScore > 60 ? 'Alta' : data.perfectionScore > 40 ? 'Média' : 'Normal'
        },
        {
            title: 'Padrões de IA',
            value: `${Math.max(0, data.aiPatternScore)}%`,
            type: data.aiPatternScore > 40 ? 'danger' : data.aiPatternScore > 20 ? 'warning' : 'good',
            label: data.aiPatternScore > 40 ? 'Fortes' : data.aiPatternScore > 20 ? 'Moderados' : 'Fracos'
        },
        {
            title: 'Estatísticas',
            value: `${data.wordCount}`,
            type: 'info',
            label: `${data.sentenceCount} sent, ${data.paragraphCount} parág`
        }
    ];
}

function generateRecommendations(humanProb, alerts, academicLevel) {
    const recommendations = [];
    
    if (humanProb >= 70) {
        recommendations.push({
            icon: 'fa-thumbs-up',
            text: 'Alta probabilidade de autoria estudantil',
            type: 'success'
        });
    } else if (humanProb >= 40) {
        recommendations.push({
            icon: 'fa-balance-scale',
            text: 'Características mistas - análise cuidadosa recomendada',
            type: 'warning'
        });
    } else {
        recommendations.push({
            icon: 'fa-exclamation-triangle',
            text: 'Fortes indícios de uso de IA - ação recomendada',
            type: 'danger'
        });
    }
    
    const highSeverityAlerts = alerts.filter(a => a.severity === 'high');
    if (highSeverityAlerts.length > 0) {
        recommendations.push({
            icon: 'fa-comment',
            text: `${highSeverityAlerts.length} alertas críticos - considere conversa com estudante`,
            type: 'danger'
        });
    }
    
    if (academicLevel === 'undergrad' && humanProb < 50) {
        recommendations.push({
            icon: 'fa-user-graduate',
            text: 'Para graduação: verificar consistência com habilidades anteriores',
            type: 'info'
        });
    }
    
    recommendations.push({
        icon: 'fa-file-signature',
        text: 'Solicite que o estudante explique pontos-chave do trabalho',
        type: 'info'
    });
    
    return recommendations;
}

// FUNÇÕES DE EXIBIÇÃO
function displayResults(result) {
    if (!result) {
        showAlert('Erro: Resultado da análise não disponível', 'error');
        return;
    }
    
    try {
        // Atualizar probabilidade
        updateProbabilityDisplay(result);
        
        // Atualizar alertas
        updateAcademicAlerts(result.academicAlerts);
        
        // Atualizar métricas
        updateAdvancedMetricsDisplay(result.advancedMetrics);
        
        // Atualizar recomendações
        updateRecommendationsDisplay(result.recommendations);
        
        // Atualizar análise detalhada
        updateDetailedAnalysis(result);
        
        // Atualizar prévia do texto
        updateTextPreview(result.analyzedText);
        
        // Mostrar resultados
        document.getElementById('resultsContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao exibir resultados:', error);
        showAlert('Erro ao exibir resultados', 'error');
    }
}

function updateProbabilityDisplay(result) {
    const humanProb = result.humanProbability || 50;
    const aiProb = result.aiProbability || 50;
    const confidence = result.confidence || 70;
    
    // Atualizar barra
    const humanProbBar = document.getElementById('humanProbabilityBar');
    const markerLabel = document.getElementById('markerLabel');
    
    if (humanProbBar) {
        humanProbBar.style.width = `${humanProb}%`;
    }
    if (markerLabel) {
        markerLabel.textContent = `${humanProb}%`;
    }
    
    // Atualizar valores
    const humanValue = document.getElementById('humanProbabilityValue');
    const aiValue = document.getElementById('aiProbabilityValue');
    const confidenceBadge = document.getElementById('confidenceBadge');
    
    if (humanValue) humanValue.textContent = `${humanProb}%`;
    if (aiValue) aiValue.textContent = `${aiProb}%`;
    if (confidenceBadge) {
        confidenceBadge.innerHTML = `<i class="fas fa-shield-alt"></i><span>CONFIANÇA: ${confidence}%</span>`;
    }
    
    // Atualizar veredito
    const verdictTitle = document.getElementById('verdictTitle');
    const verdictDescription = document.getElementById('verdictDescription');
    
    let verdict = '';
    let description = '';
    let color = '';
    
    if (humanProb >= 70) {
        verdict = 'PROVÁVEL AUTORIA ESTUDANTIL';
        description = 'O trabalho apresenta características consistentes com autoria humana';
        color = '#27ae60';
    } else if (humanProb >= 40) {
        verdict = 'CARACTERÍSTICAS MISTAS';
        description = 'Recomenda-se análise cuidadosa e diálogo com o estudante';
        color = '#f39c12';
    } else {
        verdict = 'FORTES INDÍCIOS DE USO DE IA';
        description = 'Múltiplos indicadores sugerem uso de inteligência artificial';
        color = '#e74c3c';
    }
    
    if (verdictTitle) {
        verdictTitle.textContent = verdict;
        verdictTitle.style.color = color;
    }
    if (verdictDescription) {
        verdictDescription.textContent = description;
    }
}

function updateAcademicAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="alert-item alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Nenhum alerta crítico</strong>
                    <p>O trabalho não apresentou desvios significativos</p>
                </div>
            </div>
        `;
        return;
    }
    
    alertsList.innerHTML = alerts.map(alert => `
        <div class="alert-item alert-${alert.type}">
            <i class="fas ${alert.icon}"></i>
            <div>
                <strong>${alert.title}</strong>
                <p>${alert.message}</p>
            </div>
        </div>
    `).join('');
}

function updateAdvancedMetricsDisplay(metrics) {
    const metricsContainer = document.getElementById('advancedMetrics');
    if (!metricsContainer || !metrics) return;
    
    metricsContainer.innerHTML = metrics.map(metric => `
        <div class="metric-card metric-${metric.type}">
            <div class="metric-title">${metric.title}</div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
        </div>
    `).join('');
}

function updateRecommendationsDisplay(recommendations) {
    const recList = document.getElementById('recommendationsList');
    if (!recList || !recommendations) return;
    
    recList.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item recommendation-${rec.type}">
            <i class="fas ${rec.icon}"></i>
            <span>${rec.text}</span>
        </div>
    `).join('');
}

function updateDetailedAnalysis(result) {
    const analysisGrid = document.getElementById('analysisGrid');
    if (!analysisGrid) return;
    
    const details = result.detailedAnalysis || {};
    
    analysisGrid.innerHTML = `
        <div class="analysis-item">
            <div class="analysis-label">Nível Analisado</div>
            <div class="analysis-value">${result.academicLevel.toUpperCase()}</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">Área do Conhecimento</div>
            <div class="analysis-value">${result.subjectArea}</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">Densidade de Citações</div>
            <div class="analysis-value">${details.citationDensity?.toFixed(1) || 0}/1000 palavras</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">Voz Pessoal</div>
            <div class="analysis-value">${details.personalVoiceScore || 0}%</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">Complexidade Lexical</div>
            <div class="analysis-value">${details.complexityScore || 0}%</div>
        </div>
        <div class="analysis-item">
            <div class="analysis-label">Padrões de IA Detectados</div>
            <div class="analysis-value">${Math.max(0, details.aiPatternScore || 0)}%</div>
        </div>
    `;
}

function updateTextPreview(text) {
    const preview = document.getElementById('textPreview');
    if (!preview) return;
    
    if (!text || text.trim().length === 0) {
        preview.innerHTML = `
            <div class="placeholder-text">
                <i class="fas fa-file"></i>
                <p>Nenhum texto para exibir. Faça uma análise primeiro.</p>
            </div>
        `;
        return;
    }
    
    // Limitar e formatar texto
    let displayText = text.length > 2000 ? text.substring(0, 2000) + '... [texto truncado para exibição]' : text;
    
    // Adicionar destaques básicos
    displayText = displayText.replace(/\n/g, '<br>');
    
    preview.innerHTML = `<div class="text-content">${displayText}</div>`;
}

// FUNÇÕES DE MANIPULAÇÃO DE ARQUIVOS
async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        reader.onload = async function(e) {
            try {
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
        
        if (fileExtension === 'pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

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
        throw new Error(`Erro ao processar PDF: ${error.message}`);
    }
}

async function extractTextFromDOCX(arrayBuffer) {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    } catch (error) {
        throw new Error(`Erro ao processar documento: ${error.message}`);
    }
}

// FUNÇÕES DE ALERTA
function showAlert(message, type = 'info', duration = 5000) {
    try {
        // Remover alertas anteriores
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        // Criar alerta
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="alert-close"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Estilos
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 400px;
            font-family: 'Inter', sans-serif;
        `;
        
        // Botão de fechar
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        });
        
        document.body.appendChild(alert);
        
        // Auto-remover
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, duration);
        
    } catch (error) {
        console.error('Erro ao mostrar alerta:', error);
    }
}

// INICIALIZAÇÃO DA APLICAÇÃO
document.addEventListener('DOMContentLoaded', function() {
    console.log('Detector Acadêmico de IA iniciado');
    
    // ELEMENTOS PRINCIPAIS
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        textInput: document.getElementById('textInput'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        clearBtn: document.getElementById('clearBtn'),
        loading: document.getElementById('loading'),
        resultsContainer: document.getElementById('resultsContainer'),
        academicLevel: document.getElementById('academicLevel'),
        subjectArea: document.getElementById('subjectArea'),
        expectedLength: document.getElementById('expectedLength'),
        contextIndicator: document.getElementById('contextIndicator'),
        charCount: document.getElementById('charCount'),
        helpBtn: document.getElementById('helpBtn'),
        closeHelpModal: document.getElementById('closeHelpModal'),
        helpModal: document.getElementById('helpModal'),
        generateReportBtn: document.getElementById('generateReportBtn'),
        toggleAnalysis: document.getElementById('toggleAnalysis'),
        analysisContent: document.getElementById('analysisContent')
    };
    
    // INICIALIZAR
    initializeApp();
    
    function initializeApp() {
        setupEventListeners();
        updateContextIndicator();
        setupTextInputListener();
        
        // Adicionar animações CSS
        addAlertAnimations();
        
        console.log('Aplicação inicializada com sucesso');
    }
    
    function setupEventListeners() {
        // Upload
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('drop', handleFileDrop);
        
        // Input de arquivo
        elements.fileInput.addEventListener('change', handleFileInputChange);
        
        // Contexto acadêmico
        elements.academicLevel.addEventListener('change', updateContextIndicator);
        elements.subjectArea.addEventListener('change', updateContextIndicator);
        
        // Botões principais
        elements.analyzeBtn.addEventListener('click', startAnalysis);
        elements.clearBtn.addEventListener('click', clearAll);
        elements.helpBtn.addEventListener('click', () => elements.helpModal.style.display = 'block');
        elements.closeHelpModal.addEventListener('click', () => elements.helpModal.style.display = 'none');
        
        // Botões de relatório
        elements.generateReportBtn.addEventListener('click', generateReport);
        elements.toggleAnalysis.addEventListener('click', toggleAnalysisView);
        
        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === elements.helpModal) {
                elements.helpModal.style.display = 'none';
            }
        });
    }
    
    function setupTextInputListener() {
        elements.textInput.addEventListener('input', function() {
            const count = this.value.length;
            elements.charCount.textContent = count.toLocaleString();
            
            // Auto-expand
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    function updateContextIndicator() {
        if (!elements.contextIndicator) return;
        
        const levelNames = {
            undergrad: 'Graduação',
            masters: 'Mestrado',
            doctoral: 'Doutorado',
            researcher: 'Pesquisador'
        };
        
        const areaNames = {
            humanities: 'Humanidades',
            social: 'Ciências Sociais',
            natural: 'Ciências Naturais',
            applied: 'Ciências Aplicadas'
        };
        
        const level = elements.academicLevel.value;
        const area = elements.subjectArea.value;
        
        elements.contextIndicator.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Modo: ${levelNames[level]} em ${areaNames[area]} - Análise contextual ativada</span>
        `;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        elements.uploadArea.style.background = 'linear-gradient(135deg, #e0e7ff, #d6e0ff)';
    }
    
    function handleFileDrop(e) {
        e.preventDefault();
        elements.uploadArea.style.background = 'linear-gradient(135deg, #f8f9ff, #eef2ff)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
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
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            // Validar
            const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
            if (!validExtensions.includes(fileExtension)) {
                showAlert('Formato não suportado. Use PDF, DOCX, DOC ou TXT.', 'error');
                return;
            }
            
            // Limpar textarea
            elements.textInput.value = '';
            elements.charCount.textContent = '0';
            
            // Atualizar interface
            elements.uploadArea.innerHTML = `
                <div class="upload-icon" style="color: #27ae60;">
                    <i class="fas fa-file-check"></i>
                </div>
                <h3>Arquivo selecionado</h3>
                <p class="upload-subtitle"><strong>${fileName}</strong></p>
                <div class="file-types">
                    <span class="file-type-badge">${fileExtension.toUpperCase()}</span>
                </div>
                <p class="upload-note">${formatFileSize(file.size)}</p>
                <input type="file" id="fileInput" class="file-input" accept=".pdf,.docx,.doc,.txt">
            `;
            
            showAlert(`Arquivo "${fileName}" pronto para análise`, 'success');
            
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            showAlert('Erro ao processar arquivo', 'error');
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // FUNÇÃO PRINCIPAL DE ANÁLISE
    async function startAnalysis() {
        const file = elements.fileInput?.files[0];
        const text = elements.textInput?.value.trim() || '';
        const academicLevel = elements.academicLevel.value;
        const subjectArea = elements.subjectArea.value;
        
        console.log('Iniciando análise acadêmica...', { academicLevel, subjectArea });
        
        // Validação
        if (!file && !text) {
            showAlert('Selecione um arquivo ou cole o texto do trabalho', 'error');
            return;
        }
        
        if (text && text.length < 200) {
            showAlert('Texto muito curto. Mínimo recomendado: 200 caracteres', 'warning');
            return;
        }
        
        // Mostrar loading
        elements.loading.style.display = 'block';
        elements.resultsContainer.style.display = 'none';
        
        // Atualizar progresso
        updateProgress(0, 'Inicializando análise...');
        
        try {
            let content = '';
            
            // Extrair conteúdo
            if (file) {
                updateProgress(20, `Processando arquivo: ${file.name}...`);
                showAlert(`Processando ${file.name}...`, 'info');
                content = await extractTextFromFile(file);
            } else {
                content = text;
            }
            
            updateProgress(40, 'Extraindo conteúdo do texto...');
            
            // Validar conteúdo
            if (!content || content.trim().length < 200) {
                throw new Error('Conteúdo insuficiente para análise. Mínimo: 200 caracteres.');
            }
            
            updateProgress(60, 'Analisando padrões acadêmicos...');
            
            // Realizar análise especializada
            showAlert('Analisando com algoritmo especializado...', 'info');
            const analysisResult = await analyzeAcademicText(content, academicLevel, subjectArea);
            
            updateProgress(90, 'Preparando resultados...');
            
            // Validar resultado
            if (!analysisResult || typeof analysisResult.humanProbability === 'undefined') {
                throw new Error('A análise não retornou resultados válidos.');
            }
            
            // Armazenar e exibir
            currentAnalysisResult = analysisResult;
            analysisHistory.push({
                ...analysisResult,
                timestamp: new Date().toISOString(),
                fileName: file ? file.name : 'Texto colado'
            });
            
            updateProgress(100, 'Análise concluída!');
            
            setTimeout(() => {
                elements.loading.style.display = 'none';
                displayResults(analysisResult);
                showAlert('Análise acadêmica concluída com sucesso!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Erro na análise:', error);
            showAlert(`Erro na análise: ${error.message}`, 'error');
            
            // Mostrar fallback
            const fallbackResult = {
                humanProbability: 50,
                aiProbability: 50,
                confidence: 50,
                analyzedText: text || 'Texto não disponível',
                academicLevel,
                subjectArea,
                wordCount: text.split(/\s+/).length,
                sentenceCount: text.split(/[.!?]+/).length - 1,
                paragraphCount: text.split(/\n\s*\n/).length,
                academicAlerts: [{
                    type: 'warning',
                    icon: 'fa-exclamation-triangle',
                    title: 'Análise Limitada',
                    message: 'Use um texto mais extenso para análise completa',
                    severity: 'low'
                }],
                recommendations: [{
                    icon: 'fa-info-circle',
                    text: 'Análise básica devido a limitações técnicas',
                    type: 'warning'
                }]
            };
            
            elements.loading.style.display = 'none';
            displayResults(fallbackResult);
            
        } finally {
            // Resetar progresso
            setTimeout(() => {
                const progressFill = document.getElementById('progressFill');
                const progressText = document.getElementById('progressText');
                if (progressFill) progressFill.style.width = '0%';
                if (progressText) progressText.textContent = 'Inicializando análise...';
            }, 1000);
        }
    }
    
    function updateProgress(percent, message) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
            progressFill.style.transition = 'width 0.3s ease';
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }
    
    function clearAll() {
        console.log('Limpando análise...');
        
        try {
            // Resetar inputs
            elements.fileInput.value = '';
            elements.textInput.value = '';
            elements.textInput.style.height = 'auto';
            elements.charCount.textContent = '0';
            
            // Resetar upload area
            elements.uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-file-upload"></i>
                </div>
                <h3>Arraste e solte o arquivo aqui</h3>
                <p class="upload-subtitle">ou clique para selecionar</p>
                <div class="file-types">
                    <span class="file-type-badge">PDF</span>
                    <span class="file-type-badge">DOCX</span>
                    <span class="file-type-badge">DOC</span>
                    <span class="file-type-badge">TXT</span>
                </div>
                <p class="upload-note">Tamanho máximo: 10MB</p>
                <input type="file" id="fileInput" class="file-input" accept=".pdf,.docx,.doc,.txt">
            `;
            
            // Resetar resultados
            elements.resultsContainer.style.display = 'none';
            elements.loading.style.display = 'none';
            
            // Resetar probabilidade
            const humanProbBar = document.getElementById('humanProbabilityBar');
            const markerLabel = document.getElementById('markerLabel');
            const humanValue = document.getElementById('humanProbabilityValue');
            const aiValue = document.getElementById('aiProbabilityValue');
            
            if (humanProbBar) humanProbBar.style.width = '50%';
            if (markerLabel) markerLabel.textContent = '50%';
            if (humanValue) humanValue.textContent = '0%';
            if (aiValue) aiValue.textContent = '0%';
            
            // Resetar veredito
            const verdictTitle = document.getElementById('verdictTitle');
            const verdictDescription = document.getElementById('verdictDescription');
            
            if (verdictTitle) {
                verdictTitle.textContent = 'ANÁLISE NÃO REALIZADA';
                verdictTitle.style.color = '';
            }
            if (verdictDescription) {
                verdictDescription.textContent = 'Envie um trabalho para análise';
            }
            
            // Resetar métricas
            const metricsContainer = document.getElementById('advancedMetrics');
            const alertsList = document.getElementById('alertsList');
            const recommendationsList = document.getElementById('recommendationsList');
            const analysisGrid = document.getElementById('analysisGrid');
            const textPreview = document.getElementById('textPreview');
            
            if (metricsContainer) metricsContainer.innerHTML = '';
            if (alertsList) alertsList.innerHTML = '';
            if (recommendationsList) recommendationsList.innerHTML = `
                <div class="recommendation-item">
                    <i class="fas fa-info-circle"></i>
                    <span>Analise o trabalho completo antes de tomar decisões</span>
                </div>
            `;
            if (analysisGrid) analysisGrid.innerHTML = '';
            if (textPreview) {
                textPreview.innerHTML = `
                    <div class="placeholder-text">
                        <i class="fas fa-file"></i>
                        <p>Nenhum texto para exibir. Faça uma análise primeiro.</p>
                    </div>
                `;
            }
            
            // Resetar resultado atual
            currentAnalysisResult = null;
            
            showAlert('Tudo limpo! Pronto para nova análise.', 'success');
            
        } catch (error) {
            console.error('Erro ao limpar:', error);
            showAlert('Erro ao limpar a análise', 'error');
        }
    }
    
    function toggleAnalysisView() {
        const content = elements.analysisContent;
        const toggleBtn = elements.toggleAnalysis;
        
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
            toggleBtn.classList.add('active');
        } else {
            content.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
            toggleBtn.classList.remove('active');
        }
    }
    
    function generateReport() {
        if (!currentAnalysisResult) {
            showAlert('Nenhum resultado disponível para gerar relatório', 'error');
            return;
        }
        
        try {
            if (typeof jsPDF !== 'undefined') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Configurações
                const margin = 20;
                let yPos = margin;
                
                // Cabeçalho
                doc.setFontSize(16);
                doc.setTextColor(44, 62, 80);
                doc.text('RELATÓRIO DE ANÁLISE ACADÊMICA', margin, yPos);
                yPos += 10;
                
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPos);
                yPos += 5;
                doc.text(`Nível: ${currentAnalysisResult.academicLevel.toUpperCase()}`, margin, yPos);
                yPos += 5;
                doc.text(`Área: ${currentAnalysisResult.subjectArea}`, margin, yPos);
                yPos += 10;
                
                // Probabilidade
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text('PROBABILIDADE DE AUTORIA:', margin, yPos);
                yPos += 8;
                
                doc.setFontSize(14);
                const humanProb = currentAnalysisResult.humanProbability;
                const aiProb = currentAnalysisResult.aiProbability;
                
                if (humanProb >= 70) {
                    doc.setTextColor(39, 174, 96);
                } else if (humanProb >= 40) {
                    doc.setTextColor(243, 156, 18);
                } else {
                    doc.setTextColor(231, 76, 60);
                }
                
                doc.text(`Autoria Humana: ${humanProb}%`, margin, yPos);
                yPos += 7;
                doc.setTextColor(231, 76, 60);
                doc.text(`Uso de IA: ${aiProb}%`, margin, yPos);
                yPos += 12;
                
                // Métricas
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text('MÉTRICAS ANALISADAS:', margin, yPos);
                yPos += 8;
                
                doc.setFontSize(10);
                currentAnalysisResult.advancedMetrics?.forEach((metric, index) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    doc.text(`${metric.title}: ${metric.value} (${metric.label})`, margin, yPos);
                    yPos += 5;
                });
                
                // Salvar
                const fileName = `analise-academica-${Date.now()}.pdf`;
                doc.save(fileName);
                
                showAlert(`Relatório "${fileName}" gerado com sucesso!`, 'success');
                
            } else {
                showAlert('Biblioteca PDF não disponível', 'error');
            }
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            showAlert('Erro ao gerar relatório PDF', 'error');
        }
    }
    
    function addAlertAnimations() {
        if (!document.getElementById('alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .alert-message {
                    animation: slideIn 0.3s ease;
                }
                .alert-message.slide-out {
                    animation: slideOut 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }
});
