// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
let currentAnalysisResult = null;

// PADRÕES DE DETECÇÃO (mantenha os mesmos arrays da versão anterior)
const strongAIPatterns = [ /* ... mantenha exatamente como estava ... */ ];
const strongHumanPatterns = [ /* ... mantenha exatamente como estava ... */ ];

// FUNÇÕES AUXILIARES (mantenha todas as funções anteriores)
function adjustWeightsByContentType(contentType, aiScore, humanScore) { /* ... */ }
function calculatePerplexityScore(text) { /* ... */ }
function analyzeConclusionPatterns(text) { /* ... */ }
function crossValidateAnalysis(text, initialHumanProbability) { /* ... */ }
function calculateLexicalRichness(text) { /* ... */ }
function analyzeStructuralPatterns(text) { /* ... */ }
function detectStrongAIPatterns(text) { /* ... */ }
function detectStrongHumanPatterns(text) { /* ... */ }
async function advancedAnalyzeContent(text, contentType) { /* ... */ }
function calculateConfidence(humanProb, aiPatternAnalysis, humanPatternAnalysis, perplexityAnalysis) { /* ... */ }
function generateTextHighlights(text, aiPatternAnalysis, humanPatternAnalysis) { /* ... */ }
function generateSuggestions(humanProb, aiPatternAnalysis, humanPatternAnalysis, text, contentType) { /* ... */ }
function generateDetailedExplanation(metrics) { /* ... */ }

// INICIALIZAÇÃO DA APLICAÇÃO
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
        perplexityDisplay: document.getElementById('perplexityDisplay'),
        perplexityValue: document.getElementById('perplexityValue'),
        perplexityLabel: document.getElementById('perplexityLabel'),
        verdictText: document.getElementById('verdictText'),
        confidenceText: document.getElementById('confidenceText'),
        percentagesText: document.getElementById('percentagesText'),
        humanPercent: document.querySelector('.human-percent'),
        aiPercent: document.querySelector('.ai-percent'),
        advancedMetrics: document.getElementById('advancedMetrics'),
        analysisDetails: document.getElementById('analysisDetails'),
        textPreview: document.getElementById('textPreview'),
        suggestionsList: document.getElementById('suggestionsList')
    };

    // CONFIGURAÇÃO INICIAL
    initializeApplication();

    function initializeApplication() {
        // Configurar eventos
        setupEventListeners();
        
        // Configurar tipo de conteúdo
        updateContextIndicator();
        
        // Verificar se bibliotecas estão carregadas
        checkLibraries();
    }

    function checkLibraries() {
        const libraries = {
            'pdfjsLib': typeof pdfjsLib,
            'mammoth': typeof mammoth,
            'jsPDF': typeof jsPDF
        };
        
        console.log('Status das bibliotecas:', libraries);
        
        // Verificar se todas estão carregadas
        const missingLibs = Object.entries(libraries).filter(([_, type]) => type === 'undefined');
        
        if (missingLibs.length > 0) {
            console.warn('Bibliotecas faltando:', missingLibs.map(([name]) => name));
            
            // Mostrar aviso discreto
            if (!document.getElementById('lib-warning')) {
                const warning = document.createElement('div');
                warning.id = 'lib-warning';
                warning.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #ff9800;
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    z-index: 1000;
                    font-size: 12px;
                    display: none;
                `;
                warning.textContent = 'Algumas bibliotecas não carregaram completamente. Recarregue a página.';
                document.body.appendChild(warning);
                
                // Mostrar por 5 segundos
                warning.style.display = 'block';
                setTimeout(() => warning.style.display = 'none', 5000);
            }
        }
    }

    function setupEventListeners() {
        // Upload de arquivo
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('drop', handleFileDrop);
        
        // Input de arquivo
        elements.fileInput.addEventListener('change', handleFileInputChange);
        
        // Tipo de conteúdo
        document.getElementById('contentType').addEventListener('change', updateContextIndicator);
        
        // Botões principais
        elements.analyzeBtn.addEventListener('click', startAnalysis);
        elements.clearBtn.addEventListener('click', clearAll);
        elements.downloadPdfBtn.addEventListener('click', generateDetailedPDF);
        
        // Textarea - auto-expand
        elements.textInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    function updateContextIndicator() {
        const type = document.getElementById('contentType').value;
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
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // Validar tipo de arquivo
        const validExtensions = ['pdf', 'docx', 'doc', 'txt'];
        if (!validExtensions.includes(fileExtension)) {
            showAlert('Tipo de arquivo não suportado. Use PDF, DOCX, DOC ou TXT.', 'error');
            return;
        }
        
        // Limpar textarea se houver arquivo
        elements.textInput.value = '';
        
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
        
        // Mostrar preview do nome do arquivo
        showAlert(`Arquivo "${fileName}" selecionado com sucesso!`, 'success');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showAlert(message, type = 'info') {
        // Remover alertas anteriores
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) existingAlert.remove();
        
        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="alert-close"><i class="fas fa-times"></i></button>
        `;
        
        // Estilos do alerta
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 400px;
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
        
        // Adicionar animações CSS
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
    }

    async function startAnalysis() {
        const file = elements.fileInput.files[0];
        const text = elements.textInput.value.trim();
        const contentType = document.getElementById('contentType').value;
        
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
        elements.loading.style.display = 'block';
        elements.resultsContainer.style.opacity = '0.5';
        
        try {
            let content = '';
            
            // Extrair conteúdo
            if (file) {
                showAlert(`Processando arquivo: ${file.name}...`, 'info');
                content = await extractTextFromFile(file);
            } else {
                content = text;
            }
            
            // Validar conteúdo extraído
            if (!content || content.trim().length < 50) {
                throw new Error('Conteúdo muito curto ou vazio após processamento.');
            }
            
            // Realizar análise
            showAlert('Analisando conteúdo com algoritmo avançado...', 'info');
            const analysisResult = await advancedAnalyzeContent(content, contentType);
            
            // Armazenar resultado
            currentAnalysisResult = analysisResult;
            
            // Exibir resultados
            displayResults(analysisResult);
            showAlert('Análise concluída com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro na análise:', error);
            showAlert(`Erro na análise: ${error.message}`, 'error');
        } finally {
            elements.loading.style.display = 'none';
            elements.resultsContainer.style.opacity = '1';
        }
    }

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
            // Verificar se pdfjsLib está disponível
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('Biblioteca PDF.js não carregada');
            }
            
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
            console.error('Erro no PDF:', error);
            throw new Error(`Erro ao extrair texto do PDF: ${error.message}`);
        }
    }

    async function extractTextFromDOCX(arrayBuffer) {
        try {
            // Verificar se mammoth está disponível
            if (typeof mammoth === 'undefined') {
                throw new Error('Biblioteca Mammoth não carregada');
            }
            
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Erro no DOCX:', error);
            throw new Error(`Erro ao extrair texto do documento: ${error.message}`);
        }
    }

    function displayResults(result) {
        // 1. Atualizar barra de probabilidade
        const humanProbBar = document.getElementById('humanProbabilityBar');
        humanProbBar.style.width = `${result.humanProbability}%`;
        
        // 2. Atualizar textos de probabilidade
        updateProbabilityDisplay(result);
        
        // 3. Atualizar perplexidade
        updatePerplexityDisplay(result);
        
        // 4. Atualizar métricas avançadas
        updateAdvancedMetrics(result);
        
        // 5. Atualizar detalhes da análise
        updateAnalysisDetails(result);
        
        // 6. Atualizar prévia do texto
        updateTextPreview(result);
        
        // 7. Atualizar sugestões
        updateSuggestions(result);
        
        // 8. Mostrar container de resultados
        elements.resultsContainer.style.display = 'block';
    }

    function updateProbabilityDisplay(result) {
        // Determinar veredito e cores
        let verdict = '';
        let color = '';
        let confidenceClass = '';
        
        if (result.humanProbability >= 80) {
            verdict = 'ALTA PROBABILIDADE DE CONTEÚDO HUMANO';
            color = '#27ae60';
            confidenceClass = 'high-confidence';
        } else if (result.humanProbability >= 65) {
            verdict = 'PROVÁVEL CONTEÚDO HUMANO';
            color = '#2ecc71';
            confidenceClass = 'medium-confidence';
        } else if (result.humanProbability >= 50) {
            verdict = 'CARACTERÍSTICAS MISTAS';
            color = '#f39c12';
            confidenceClass = 'medium-confidence';
        } else if (result.humanProbability >= 30) {
            verdict = 'PROVÁVEL CONTEÚDO DE IA';
            color = '#e74c3c';
            confidenceClass = 'medium-confidence';
        } else {
            verdict = 'ALTA PROBABILIDADE DE IA GENERATIVA';
            color = '#c0392b';
            confidenceClass = 'high-confidence';
        }
        
        // Atualizar elementos
        elements.verdictText.textContent = verdict;
        elements.verdictText.style.color = color;
        
        elements.confidenceText.textContent = `Confiança: ${result.confidence}%`;
        elements.confidenceText.className = `confidence ${confidenceClass}`;
        
        elements.humanPercent.textContent = `Humano: ${result.humanProbability}%`;
        elements.aiPercent.textContent = `IA: ${result.aiProbability}%`;
        elements.humanPercent.style.color = '#27ae60';
        elements.aiPercent.style.color = '#e74c3c';
    }

    function updatePerplexityDisplay(result) {
        if (result.detailedMetrics && result.detailedMetrics.perplexityAnalysis) {
            const perplexity = result.detailedMetrics.perplexityAnalysis;
            
            elements.perplexityValue.textContent = `${Math.round(perplexity.score)}%`;
            elements.perplexityLabel.textContent = perplexity.details;
            
            // Cor baseada no valor
            if (perplexity.score > 50) {
                elements.perplexityValue.style.color = '#27ae60';
            } else if (perplexity.score > 30) {
                elements.perplexityValue.style.color = '#f39c12';
            } else {
                elements.perplexityValue.style.color = '#e74c3c';
            }
            
            elements.perplexityDisplay.style.display = 'block';
        }
    }

    function updateAdvancedMetrics(result) {
        const metrics = result.advancedMetrics;
        
        const metricCards = [
            {
                title: 'Elementos Humanos',
                value: `${metrics.humanPatternScore}%`,
                type: metrics.humanPatternScore >= 25 ? 'good' : metrics.humanPatternScore >= 15 ? 'warning' : 'bad',
                label: metrics.humanPatternScore >= 25 ? 'Alto' : metrics.humanPatternScore >= 15 ? 'Moderado' : 'Baixo'
            },
            {
                title: 'Padrões IA',
                value: `${metrics.aiPatternScore}%`,
                type: metrics.aiPatternScore >= 35 ? 'bad' : metrics.aiPatternScore >= 20 ? 'warning' : 'good',
                label: metrics.aiPatternScore >= 35 ? 'Alto' : metrics.aiPatternScore >= 20 ? 'Moderado' : 'Baixo'
            },
            {
                title: 'Riqueza Lexical',
                value: `${metrics.lexicalRichness}%`,
                type: metrics.lexicalRichness >= 35 ? 'good' : metrics.lexicalRichness >= 25 ? 'warning' : 'bad',
                label: metrics.lexicalRichness >= 35 ? 'Alta' : metrics.lexicalRichness >= 25 ? 'Média' : 'Baixa'
            },
            {
                title: 'Variação Estrutural',
                value: `${metrics.perplexityScore}%`,
                type: metrics.perplexityScore >= 45 ? 'good' : metrics.perplexityScore >= 25 ? 'warning' : 'bad',
                label: metrics.perplexityScore >= 45 ? 'Alta' : metrics.perplexityScore >= 25 ? 'Média' : 'Baixa'
            },
            {
                title: 'Uso de Negrito',
                value: metrics.boldCount,
                type: metrics.boldCount >= 12 ? 'bad' : metrics.boldCount >= 8 ? 'warning' : 'good',
                label: metrics.boldCount >= 12 ? 'Alto' : metrics.boldCount >= 8 ? 'Moderado' : 'Normal'
            },
            {
                title: 'Nota IA Explícita',
                value: metrics.hasExplicitIANote ? 'SIM' : 'Não',
                type: metrics.hasExplicitIANote ? 'bad' : 'good',
                label: metrics.hasExplicitIANote ? 'Detectada' : 'Não detectada'
            }
        ];
        
        elements.advancedMetrics.innerHTML = metricCards.map(card => `
            <div class="metric-card ${card.type === 'good' ? 'metric-good' : card.type === 'warning' ? 'metric-warning' : 'metric-bad'}">
                <div class="metric-card-title">${card.title}</div>
                <div class="metric-value">${card.value}</div>
                <div class="metric-label">${card.label}</div>
            </div>
        `).join('');
    }

    function updateAnalysisDetails(result) {
        elements.analysisDetails.innerHTML = `
            <div class="detail-item">
                <strong>Tipo de Conteúdo Analisado:</strong>
                <span>${document.querySelector(`#contentType option[value="${result.contentType}"]`).textContent}</span>
            </div>
            <div class="detail-item">
                <strong>Estatísticas do Texto:</strong>
                <span>${result.wordCount} palavras, ${result.sentenceCount} sentenças, ${result.paragraphCount} parágrafos</span>
            </div>
            <div class="detail-item">
                <strong>Elementos Humanos Detectados:</strong>
                <span>${result.detailedMetrics.humanPatternAnalysis.patterns.length} padrões 
                ${result.detailedMetrics.humanPatternAnalysis.normalizedScore > 30 ? '(FORTES)' : ''}</span>
            </div>
            <div class="detail-item">
                <strong>Padrões de IA Detectados:</strong>
                <span>${result.detailedMetrics.aiPatternAnalysis.patterns.length} padrões 
                ${result.detailedMetrics.aiPatternAnalysis.normalizedScore > 30 ? '(FORTES)' : ''}</span>
            </div>
            <div class="detail-item">
                <strong>Riqueza Lexical:</strong>
                <span>${result.advancedMetrics.lexicalRichness}% 
                ${result.advancedMetrics.lexicalRichness > 35 ? '(Alta)' : result.advancedMetrics.lexicalRichness < 25 ? '(Baixa)' : ''}</span>
            </div>
            <div class="detail-item">
                <strong>Ajuste Contextual:</strong>
                <span>${result.advancedMetrics.contextAdjustment > 0 ? '+' : ''}${result.advancedMetrics.contextAdjustment} pontos</span>
            </div>
        `;
    }

    function updateTextPreview(result) {
        if (!result.analyzedText || result.analyzedText.trim().length === 0) {
            elements.textPreview.innerHTML = '<p class="placeholder">Nenhum texto disponível para exibição.</p>';
            return;
        }
        
        let highlightedText = result.analyzedText;
        
        // Ordenar destaques
        const allHighlights = [
            ...(result.textHighlights?.aiPatterns || []).map(h => ({...h, type: 'ai'})),
            ...(result.textHighlights?.humanElements || []).map(h => ({...h, type: 'human'}))
        ].sort((a, b) => b.start - a.start);
        
        // Aplicar destaques
        allHighlights.forEach(highlight => {
            if (highlight.start >= 0 && highlight.end <= highlightedText.length) {
                const before = highlightedText.substring(0, highlight.start);
                const target = highlightedText.substring(highlight.start, highlight.end);
                const after = highlightedText.substring(highlight.end);
                
                if (highlight.type === 'ai') {
                    highlightedText = before + 
                        `<span class="highlight-ai" title="${highlight.description || 'Padrão de IA'}">${target}</span>` + 
                        after;
                } else {
                    highlightedText = before + 
                        `<span class="highlight-human" title="${highlight.description || 'Elemento humano'}">${target}</span>` + 
                        after;
                }
            }
        });
        
        // Limitar texto muito longo
        if (highlightedText.length > 5000) {
            highlightedText = highlightedText.substring(0, 5000) + '... [texto truncado para exibição]';
        }
        
        elements.textPreview.innerHTML = highlightedText;
    }

    function updateSuggestions(result) {
        if (!result.suggestions || result.suggestions.length === 0) {
            elements.suggestionsList.innerHTML = '<li>Nenhuma sugestão disponível.</li>';
            return;
        }
        
        elements.suggestionsList.innerHTML = result.suggestions
            .map(suggestion => `<li>${suggestion}</li>`)
            .join('');
    }

    function clearAll() {
        // Resetar inputs
        elements.fileInput.value = '';
        elements.textInput.value = '';
        elements.textInput.style.height = 'auto';
        
        // Resetar upload area
        elements.uploadArea.innerHTML = `
            <i class="fas fa-file-upload fa-3x"></i>
            <h3>Arraste e solte arquivos aqui</h3>
            <p>ou clique para selecionar</p>
            <p class="file-types">Formatos suportados: PDF, DOCX, DOC, TXT</p>
            <input type="file" id="fileInput" class="file-input" accept=".pdf,.docx,.doc,.txt">
        `;
        
        // Resetar resultados
        elements.resultsContainer.style.display = 'none';
        elements.perplexityDisplay.style.display = 'none';
        
        // Resetar barra de probabilidade
        document.getElementById('humanProbabilityBar').style.width = '50%';
        
        // Resetar textos
        elements.verdictText.textContent = 'Carregando análise...';
        elements.verdictText.style.color = '';
        elements.confidenceText.textContent = 'Confiança: 0%';
        elements.humanPercent.textContent = 'Humano: 0%';
        elements.aiPercent.textContent = 'IA: 0%';
        
        // Resetar métricas
        elements.advancedMetrics.innerHTML = '';
        elements.analysisDetails.innerHTML = '';
        elements.textPreview.innerHTML = '<p class="placeholder">Nenhum texto para exibir. Faça uma análise primeiro.</p>';
        elements.suggestionsList.innerHTML = '<li>Selecione ou cole um texto para análise</li>';
        
        // Limpar resultado atual
        currentAnalysisResult = null;
        
        showAlert('Tudo limpo! Você pode começar uma nova análise.', 'success');
    }

    function generateDetailedPDF() {
        if (!currentAnalysisResult) {
            showAlert('Nenhum resultado disponível para gerar PDF.', 'error');
            return;
        }
        
        // Implementação básica do PDF
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
                
                // Salvar PDF
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
});
