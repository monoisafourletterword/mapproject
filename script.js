DG.then(function () {
    var map = DG.map('map', {
        center: [57.146122, 65.57817],
        zoom: 13, // Масштаб карты
        key: "fd0b12bb-aa73-4032-923c-a1c2f066cb81",
    });


    var markers = [];

    function removeMarkerWithAnimation(marker) {
        // Анимация исчезновения (например, изменение прозрачности)
        var icon = marker._icon; // Получаем доступ к DOM элементу маркера
        if (icon) {
            icon.style.transition = 'opacity 0.3s';
            icon.style.opacity = 0;
        }

        // Удаление маркера после анимации
        setTimeout(function () {
            map.removeLayer(marker);
        }, 1000); // Задержка должна соответствовать продолжительности анимации
    }

    function clearMarkers() {
        markers.forEach(function (marker) {
            removeMarkerWithAnimation(marker);
        });
        markers = [];
    }

    function addMarkers(filteredEvents) {
        clearMarkers();
        filteredEvents.forEach(function (event) {
            var iconUrl = icons[event.type] || 'path/to/default/icon.png'; // Укажите путь к вашей иконке по умолчанию
            var icon = DG.icon({
                iconUrl: iconUrl,
                iconSize: [30, 36.1], // Размеры иконки, настройте под ваши иконки
            });
            var marker = DG.marker(event.coordinates, { icon: icon }).addTo(map);
            var popupContent = '<div style="max-width: 300px;">' +
                '<h2 style="font-size: 16px; margin-bottom: 5px;">' + event.name + '</h2>' +
                '<p style="font-size: 14px; color: #888888; margin-bottom: 5px;">' + event.organization + '</p>' +
                '<img src="' + event.image + '" style="width: 100%; height: auto; margin-bottom: 5px;">' +
                '<p style="font-size: 14px; margin-bottom: 5px;">' + event.description + '</p>' +
                '<p style="font-size: 14px; margin-bottom: 5px;">Дата: ' + event.date + '</p>' +
                '<p style="font-size: 14px; margin-bottom: 5px;">Время: ' + event.time + '</p>' +
                '<p style="font-size: 14px; margin-bottom: 5px;">Цена: ' + event.price + ' ₽</p>' +
                '<p style="font-size: 14px; margin-bottom: 5px;">Участники: ' + event.attendees + '/' + event.capacity + '</p>' +
                '</div>';
            marker.bindPopup(popupContent);
            markers.push(marker);
        });
    }

    addMarkers(events); // Инициализация: добавляем маркеры всех мероприятий

    var typesList = document.querySelector('.types-list');
    var eventsList = document.querySelector('.events-list');

    typesList.addEventListener('click', function (e) {
        // Пытаемся найти ближайший родительский элемент с классом 'event-type', начиная с целевого элемента
        var targetTypeElement = e.target.closest('.event-type');

        if (targetTypeElement) {
            var type = targetTypeElement.getAttribute('data-type');
            if (type) {
                showEventsByType(type);
            }
        }
    });


    function showEventsByType(type) {
        var filteredEvents = events.filter(event => event.type === type);
        addMarkers(filteredEvents); // Обновляем маркеры на карте

        // Обновление списка мероприятий в сайдбаре
        eventsList.innerHTML = '';

        // Создание кнопки "Назад"
        var back = document.getElementById('back');
        back.style.display = 'flex'; // Показываем кнопку "Назад"

        // Обработчик клика на кнопку "Назад"
        back.onclick = function () {
            typesList.style.display = 'block';
            eventsList.style.display = 'none';
            addMarkers(events); // Возвращаем все мероприятия
            map.setView([57.146122, 65.57817], 13, { animate: true, duration: 0.8 });
            back.style.display = 'none'; // Скрываем кнопку "Назад"
        };


        filteredEvents.forEach(function (event) {
            var remainingSeats = event.capacity - event.attendees;
            var seatColor = remainingSeats > 0 ? 'green' : 'red';
            var address = event.coordinates.toString(); // Заглушка для адреса, замените на реальные адреса, если доступны

            formatCoordinates(event.coordinates).then(address => {
                var eventElement = document.createElement('div');
                eventElement.classList.add('event');
                eventElement.innerHTML = `
                <p id="organization">${event.organization}</p>
                <p>Тюмень, ${address}</p> <!-- Используйте координаты вместо адреса -->
                <p>${event.date}</p>
                <div class="event-image"><img src="${event.image}" alt="${event.name}" class="event-image"></div>
                <p class="event-name">${event.name}</p>   
                <p id="price">${event.price} ₽</p>
                <p>${event.description}</p>
                <p class="event-time"><span id="time">${event.time}</span><span id="blockseats"><span class="seat-info" style="color: ${seatColor}">${remainingSeats} мест</span></span></p>
                <a class="green-button">Я пойду</a>
            `;
                eventsList.appendChild(eventElement);
            }).catch(error => {
                console.error('Error converting coordinates to address:', error);
                // Handle error or insert a placeholder error message in the DOM
            });
        });

        typesList.style.display = 'none';
        eventsList.style.display = 'block';
    }



    var showWholeCity = document.getElementById('showWholeCity');
    showWholeCity.addEventListener('click', function () {
        map.setView([57.146122, 65.57817], 13, { animate: true, duration: 0.9 });
    });

    //Поиск мероприятий
    var searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function (e) {
        var searchText = e.target.value.trim().toLowerCase();
        var searchResults = document.querySelector('.search-results');
        searchResults.innerHTML = '';

        if (searchText === '') {
            searchResults.style.display = 'none';
            return;
        }

        var matches = events.filter(function (event) {
            return event.name.toLowerCase().includes(searchText);
        });

        if (matches.length === 0) {
            var noResults = document.createElement('div');
            noResults.textContent = 'Нет результатов';
            searchResults.appendChild(noResults);
            searchResults.style.display = 'block';
            return;
        }

        matches.forEach(function (match) {
            var result = document.createElement('div');
            result.textContent = match.name;
            result.classList.add('event');
            result.onclick = function () {
                myMap.setCenter(match.coordinates, 15, { duration: 800, timingFunction: 'ease-in-out' });
                searchInput.value = '';
                searchResults.style.display = 'none';
            };
            searchResults.appendChild(result);
        });

        searchResults.style.display = 'block';
    });

    // Function to convert coordinates into an address using 2GIS API
    function formatCoordinates(coordinates) {
        const latitude = coordinates[0];
        const longitude = coordinates[1];
        const apiKey = 'fd0b12bb-aa73-4032-923c-a1c2f066cb81'; // Replace 'YOUR_2GIS_API_KEY' with your actual 2GIS API key

        return new Promise((resolve, reject) => {
            fetch(`https://catalog.api.2gis.com/3.0/items/geocode?lat=${latitude}&lon=${longitude}&fields=items.address&key=${apiKey}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.result && data.result.items.length > 0) {
                        // Assuming the first result is the most relevant
                        const address = data.result.items[0].address_name;

                        resolve(address);
                    } else {
                        reject('Address not found');
                    }
                })
                .catch(error => {
                    console.error('Error fetching address:', error);
                    reject('Address not found');
                });
        });
    }

    function updateEventCounters() {
        // Предварительное заполнение счетчиков нулями
        document.querySelectorAll('.event-type-count').forEach(element => {
            element.textContent = '0';
        });

        // Подсчет мероприятий по типам
        const eventTypes = [...new Set(events.map(event => event.type))];
        const eventCounts = eventTypes.reduce((acc, type) => {
            acc[type] = events.filter(event => event.type === type).length;
            return acc;
        }, {});

        // Обновление счетчиков в DOM
        eventTypes.forEach(type => {
            const countElement = document.querySelector(`.event-type[data-type="${type}"] .event-type-count`);
            if (countElement) {
                countElement.textContent = eventCounts[type];
            }
        });
    }


    updateEventCounters();
});

