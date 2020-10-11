window.addEventListener('load', function () {

    let countUser = document.querySelector('.count-user'),
        countComp = document.querySelector('.count-comp'),
        userField = document.querySelector('.user-field'),
        compField = document.querySelector('.comp-field'),
        res = document.querySelector('.result'),
        sound = document.querySelector('.sound'),
        play = document.querySelector('.play'),
        fields = document.querySelectorAll('.field'),
        userStep, compStep, countU = 0, countC = 0, blocked = false;

    function choiceUser(e) {
        if (blocked) return; // после выбора, пока думает компьютер, другие кнопки недоступны.
        let target = e.target;
        if (target.classList.contains('field')) { //проверка нажатия на кнопку.
            userStep = target.dataset.field; //записывает атрибут клика пользователя.
            fields.forEach(item => item.classList.remove('active', 'error')); //очистка результата.
            target.classList.add('active');
            choiceComp();
        }
    }

    function choiceComp() {
        blocked = true; //запретить пользователю менять фигуру, пока комп вычесляет.
        let rand = Math.floor(Math.random() * 3); //выбор компа какую фигуру взять
        compField.classList.add('blink'); //активация аниамции
        let compFields = compField.querySelectorAll('.field');
        setTimeout(() => {
            compField.classList.remove('blink'); //удалить анимацию.
            compStep = compFields[rand].dataset.field; // результат компа
            compFields[rand].classList.add('active');
            winner();
        }, 2000); //задержка перед выбором фигуры 2сек

    }

    function winner() {
        blocked = false;
        let comb = userStep + compStep;
        switch (comb) {
            case 'rr':  //В случаи ничьей проигрывается звук draw
            case 'ss':
            case 'pp':
                res.innerText = 'Ничья!';
                sound.setAttribute('src', 'audio/draw.mp3');
                sound.play();
                break;

            case 'rs':
            case 'sp':
            case 'pr':
                res.innerText = 'Победа!';
                sound.setAttribute('src', 'audio/win.mp3');
                sound.play();
                countU++;
                countUser.innerText = countU;
                compField.querySelector('[data-field=' + compStep + ']').classList.add('error');
                break;

            case 'sr':
            case 'ps':
            case 'rp':
                res.innerText = 'Проигрыш!';
                sound.setAttribute('src', 'audio/loss.mp3');
                sound.play();
                countC++;
                countComp.innerText = countC;
                userField.querySelector('[data-field=' + userStep + ']').classList.add('error');
                break;
        }
    }

    function playGame() {
        countU = countC = 0;
        res.innerText = 'Сделайте выбор!';
        countUser.innerText = '0';
        countComp.innerText = '0';
        fields.forEach(item => item.classList.remove('active', 'error'));
    }

    play.addEventListener('click', playGame);
    userField.addEventListener('click', choiceUser);

});
