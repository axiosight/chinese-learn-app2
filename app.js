// Инициализация WebApp
const tg = window.Telegram.WebApp;

// Элементы DOM
const userInfoEl = document.getElementById('user-info');
const charactersListEl = document.getElementById('characters-list');
const characterFormEl = document.getElementById('character-form');
const searchInputEl = document.getElementById('search-input');
const searchBtnEl = document.getElementById('search-btn');
const tabContents = document.querySelectorAll('.tab-content');
const tabButtons = document.querySelectorAll('.tab-btn');
const modalEl = document.getElementById('character-modal');
const closeModalBtn = document.querySelector('.close-btn');
const deleteCharacterBtn = document.getElementById('delete-character');
const practiceAreaEl = document.getElementById('practice-area');
const questionContainerEl = document.getElementById('question-container');
const optionsContainerEl = document.getElementById('options-container');
const resultMessageEl = document.getElementById('result-message');
const nextQuestionBtn = document.getElementById('next-question');
const modeButtons = document.querySelectorAll('.mode-btn');
const progressBarEl = document.getElementById('progress-bar');
const progressTextEl = document.getElementById('progress-text');

// Состояние приложения
let appState = {
    characters: [],
    currentTab: 'my-characters',
    currentPracticeMode: 'meaning',
    currentQuestionIndex: 0,
    correctAnswers: 0,
    practiceQuestions: [],
    selectedCharacter: null,
    initData: tg.initData || tg.initDataUnsafe
};

// Инициализация приложения
function initApp() {
    // Показываем информацию о пользователе
    if (appState.initData.user) {
        const user = appState.initData.user;
        userInfoEl.innerHTML = `
            <p>${user.first_name} ${user.last_name || ''}</p>
            <p>@${user.username || 'нет username'}</p>
        `;
    }

    // Загружаем иероглифы пользователя
    loadUserCharacters();

    // Настройка табов
    setupTabs();

    // Настройка модального окна
    setupModal();

    // Настройка формы добавления иероглифа
    setupCharacterForm();

    // Настройка поиска
    setupSearch();

    // Настройка режима практики
    setupPracticeMode();
}

// Загрузка иероглифов пользователя
function loadUserCharacters() {
    if (!appState.initData.user) return;

    // В реальном приложении здесь будет запрос к вашему бэкенду
    // Для демонстрации используем заглушку
    fetchUserCharacters()
        .then(characters => {
            appState.characters = characters;
            renderCharactersList(characters);
        })
        .catch(error => {
            console.error('Ошибка загрузки иероглифов:', error);
            showError('Не удалось загрузить иероглифы');
        });
}

// Запрос к боту для получения иероглифов пользователя
function fetchUserCharacters() {
    return new Promise((resolve, reject) => {
        // В реальном приложении используйте Telegram.WebApp.sendData
        // или fetch к вашему API
        if (tg.platform !== 'unknown') {
            tg.sendData(JSON.stringify({
                action: 'get_characters',
                user_id: appState.initData.user.id
            }));
            
            // Обработчик ответа от бота
            tg.onEvent('webAppDataReceived', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.characters) {
                        resolve(data.characters);
                    } else {
                        reject(new Error('Нет данных об иероглифах'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        } else {
            // Для тестирования вне Telegram
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        character: '好',
                        pinyin: 'hǎo',
                        meaning: 'хороший',
                        example: '你好',
                        example_meaning: 'здравствуйте'
                    },
                    {
                        id: 2,
                        character: '谢',
                        pinyin: 'xiè',
                        meaning: 'благодарить',
                        example: '谢谢',
                        example_meaning: 'спасибо'
                    },
                    {
                        id: 3,
                        character: '爱',
                        pinyin: 'ài',
                        meaning: 'любовь',
                        example: '我爱你',
                        example_meaning: 'я тебя люблю'
                    }
                ]);
            }, 500);
        }
    });
}

// Отображение списка иероглифов
function renderCharactersList(characters) {
    charactersListEl.innerHTML = '';
    
    if (characters.length === 0) {
        charactersListEl.innerHTML = '<p class="no-characters">У вас пока нет сохраненных иероглифов</p>';
        return;
    }
    
    characters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-symbol">${character.character}</div>
            <div class="character-pinyin">${character.pinyin}</div>
        `;
        card.addEventListener('click', () => openCharacterModal(character));
        charactersListEl.appendChild(card);
    });
}

// Настройка табов
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Убираем активный класс у всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс к выбранной кнопке и контенту
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            appState.currentTab = tabId;
            
            // Если открыли вкладку практики, инициализируем вопросы
            if (tabId === 'practice') {
                initPractice();
            }
        });
    });
}

// Настройка модального окна
function setupModal() {
    closeModalBtn.addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
            closeModal();
        }
    });
    
    deleteCharacterBtn.addEventListener('click', deleteCurrentCharacter);
}

// Открытие модального окна с информацией об иероглифе
function openCharacterModal(character) {
    appState.selectedCharacter = character;
    
    document.getElementById('modal-title').textContent = character.character;
    document.getElementById('modal-character').textContent = character.character;
    document.getElementById('modal-pinyin').textContent = character.pinyin;
    document.getElementById('modal-meaning').textContent = character.meaning;
    document.getElementById('modal-example').textContent = character.example || '—';
    document.getElementById('modal-example-meaning').textContent = character.example_meaning || '—';
    
    modalEl.classList.remove('hidden');
}

// Закрытие модального окна
function closeModal() {
    modalEl.classList.add('hidden');
    appState.selectedCharacter = null;
}

// Удаление текущего иероглифа
function deleteCurrentCharacter() {
    if (!appState.selectedCharacter) return;
    
    if (confirm(`Удалить иероглиф ${appState.selectedCharacter.character}?`)) {
        // В реальном приложении здесь будет запрос к боту
        tg.sendData(JSON.stringify({
            action: 'delete_character',
            character_id: appState.selectedCharacter.id
        }));
        
        // Обновляем список иероглифов
        appState.characters = appState.characters.filter(
            char => char.id !== appState.selectedCharacter.id
        );
        renderCharactersList(appState.characters);
        closeModal();
    }
}

// Настройка формы добавления иероглифа
function setupCharacterForm() {
    characterFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const character = document.getElementById('character').value.trim();
        const pinyin = document.getElementById('pinyin').value.trim();
        const meaning = document.getElementById('meaning').value.trim();
        const example = document.getElementById('example').value.trim();
        const exampleMeaning = document.getElementById('example-meaning').value.trim();
        
        if (!character || !pinyin || !meaning) {
            showError('Заполните обязательные поля: иероглиф, пиньин и значение');
            return;
        }
        
        // Отправляем данные боту
        tg.sendData(JSON.stringify({
            action: 'add_character',
            character,
            pinyin,
            meaning,
            example: example || null,
            example_meaning: exampleMeaning || null
        }));
        
        // Добавляем иероглиф в список (в реальном приложении ждем подтверждения от бота)
        const newCharacter = {
            id: Date.now(), // Временный ID, в реальном приложении будет от бота
            character,
            pinyin,
            meaning,
            example: example || null,
            example_meaning: exampleMeaning || null
        };
        
        appState.characters.unshift(newCharacter);
        renderCharactersList(appState.characters);
        
        // Очищаем форму
        characterFormEl.reset();
        
        // Показываем уведомление
        showSuccess('Иероглиф успешно добавлен!');
        
        // Переключаемся на вкладку с иероглифами
        document.querySelector(`.tab-btn[data-tab="my-characters"]`).click();
    });
}

// Настройка поиска
function setupSearch() {
    searchBtnEl.addEventListener('click', performSearch);
    searchInputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Выполнение поиска
function performSearch() {
    const query = searchInputEl.value.trim().toLowerCase();
    
    if (query === '') {
        renderCharactersList(appState.characters);
        return;
    }
    
    const filtered = appState.characters.filter(char => 
        char.character.toLowerCase().includes(query) ||
        char.pinyin.toLowerCase().includes(query) ||
        char.meaning.toLowerCase().includes(query) ||
        (char.example && char.example.toLowerCase().includes(query)) ||
        (char.example_meaning && char.example_meaning.toLowerCase().includes(query))
    );
    
    renderCharactersList(filtered);
}

// Настройка режима практики
function setupPracticeMode() {
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            appState.currentPracticeMode = button.getAttribute('data-mode');
            initPractice();
        });
    });
    
    nextQuestionBtn.addEventListener('click', showNextQuestion);
}

// Инициализация практики
function initPractice() {
    if (appState.characters.length < 2) {
        practiceAreaEl.innerHTML = `
            <p>Для практики нужно как минимум 2 иероглифа.</p>
            <p>Добавьте больше иероглифов во вкладке "Добавить".</p>
        `;
        return;
    }
    
    // Создаем вопросы для практики
    appState.practiceQuestions = generatePracticeQuestions();
    appState.currentQuestionIndex = 0;
    appState.correctAnswers = 0;
    
    // Обновляем прогресс
    updateProgress();
    
    // Показываем первый вопрос
    showCurrentQuestion();
}

// Генерация вопросов для практики
function generatePracticeQuestions() {
    const questions = [];
    const characters = [...appState.characters];
    
    // Перемешиваем массив
    for (let i = characters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [characters[i], characters[j]] = [characters[j], characters[i]];
    }
    
    // Создаем вопросы
    characters.forEach(character => {
        if (appState.currentPracticeMode === 'meaning') {
            questions.push({
                type: 'meaning',
                question: character.meaning,
                correctAnswer: character.character,
                pinyin: character.pinyin,
                options: getRandomOptions(character.character, 'character')
            });
        } else {
            questions.push({
                type: 'character',
                question: character.character,
                correctAnswer: character.meaning,
                pinyin: character.pinyin,
                options: getRandomOptions(character.meaning, 'meaning')
            });
        }
    });
    
    return questions;
}

// Получение случайных вариантов ответа
function getRandomOptions(correctAnswer, field) {
    const options = [correctAnswer];
    const otherCharacters = appState.characters.filter(
        char => char[field] !== correctAnswer
    );
    
    // Перемешиваем массив
    for (let i = otherCharacters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherCharacters[i], otherCharacters[j]] = [otherCharacters[j], otherCharacters[i]];
    }
    
    // Добавляем еще 3 варианта
    for (let i = 0; i < 3 && i < otherCharacters.length; i++) {
        options.push(otherCharacters[i][field]);
    }
    
    // Перемешиваем варианты
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
}

// Показ текущего вопроса
function showCurrentQuestion() {
    const question = appState.practiceQuestions[appState.currentQuestionIndex];
    
    questionContainerEl.innerHTML = '';
    optionsContainerEl.innerHTML = '';
    resultMessageEl.innerHTML = '';
    nextQuestionBtn.classList.add('hidden');
    
    if (question.type === 'meaning') {
        questionContainerEl.innerHTML = `
            <p>Что означает:</p>
            <h3>${question.question}</h3>
            <p>${question.pinyin}</p>
        `;
    } else {
        questionContainerEl.innerHTML = `
            <p>Какой иероглиф означает:</p>
            <h3>${question.question}</h3>
        `;
    }
    
    // Добавляем варианты ответа
    question.options.forEach((option, index) => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'option-btn';
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => checkAnswer(option, question.correctAnswer));
        optionsContainerEl.appendChild(optionBtn);
    });
}

// Проверка ответа
function checkAnswer(selectedAnswer, correctAnswer) {
    const optionButtons = document.querySelectorAll('.option-btn');
    
    optionButtons.forEach(button => {
        button.disabled = true;
        
        if (button.textContent === correctAnswer) {
            button.classList.add('correct');
        } else if (button.textContent === selectedAnswer && selectedAnswer !== correctAnswer) {
            button.classList.add('incorrect');
        }
    });
    
    if (selectedAnswer === correctAnswer) {
        resultMessageEl.innerHTML = '<p style="color: var(--success-color)">Правильно! 👍</p>';
        appState.correctAnswers++;
    } else {
        resultMessageEl.innerHTML = `
            <p style="color: var(--danger-color)">Неправильно 👎</p>
            <p>Правильный ответ: ${correctAnswer}</p>
        `;
    }
    
    nextQuestionBtn.classList.remove('hidden');
    updateProgress();
}

// Показ следующего вопроса
function showNextQuestion() {
    appState.currentQuestionIndex++;
    
    if (appState.currentQuestionIndex < appState.practiceQuestions.length) {
        showCurrentQuestion();
    } else {
        // Практика завершена
        const accuracy = Math.round(
            (appState.correctAnswers / appState.practiceQuestions.length) * 100
        );
        
        practiceAreaEl.innerHTML = `
            <h3>Практика завершена!</h3>
            <p>Результат: ${appState.correctAnswers} из ${appState.practiceQuestions.length}</p>
            <p>Точность: ${accuracy}%</p>
            <button id="restart-practice" class="submit-btn">Начать заново</button>
        `;
        
        document.getElementById('restart-practice').addEventListener('click', initPractice);
    }
}

// Обновление прогресса
function updateProgress() {
    const progress = appState.currentQuestionIndex / appState.practiceQuestions.length * 100;
    progressBarEl.style.width = `${progress}%`;
    progressTextEl.textContent = `${appState.currentQuestionIndex}/${appState.practiceQuestions.length}`;
}

// Показать сообщение об ошибке
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.color = 'var(--danger-color)';
    errorEl.style.margin = '10px 0';
    errorEl.style.textAlign = 'center';
    
    const currentTab = document.querySelector(`.tab-content.active`);
    currentTab.insertBefore(errorEl, currentTab.firstChild);
    
    setTimeout(() => {
        errorEl.remove();
    }, 3000);
}

// Показать сообщение об успехе
function showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;
    successEl.style.color = 'var(--success-color)';
    successEl.style.margin = '10px 0';
    successEl.style.textAlign = 'center';
    
    const currentTab = document.querySelector(`.tab-content.active`);
    currentTab.insertBefore(successEl, currentTab.firstChild);
    
    setTimeout(() => {
        successEl.remove();
    }, 3000);
}

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);

// Для тестирования вне Telegram
if (tg.platform === 'unknown') {
    document.body.classList.add('web');
}