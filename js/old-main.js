// cellContents should be created based on backend output

var cellContents = {
    '2017-11-14': {
        'Airport 1': {
            'Price': 579,
            'Time': '12:34',
            'Options': []
        },
        'Airport 2': {
            'Price': 590,
            'Time': '12:55',
            'Options': []
        }
    },
    '2017-11-15': {
        'Airport 3': {
            'Price': 1579,
            'Time': '20:10',
            'Options': []
        },
        'Airport 2': {
            'Price': 590,
            'Time': '12:55',
            'Options': []
        }
    },
    '2017-11-28': {
        'Airport 4': {
            'Price': 7278,
            'Time': '20:30',
            'Options': []
        },
        'Airport 5': {
            'Price': 7278,
            'Time': '17:55',
            'Options': []
        }
    },
    '2017-12-24': {
        'Airport 1': {
            'Price': 7348,
            'Time': '20:30',
            'Options': []
        }
    }
};

var activeDates = Object.keys(cellContents);

// Current month and month array declaration, to use in external navigation for datepicker

var activeMonth = new Date().getMonth() + 1;
var monthsArray = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

// Initiate jQuery UI Datepicker on a block element.

$('#calendar').datepicker({
    altField: "#calendar-input",
    dateFormat: "yy-mm-dd",
    dayNamesMin: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"],
    //defaultDate: activeDates[0],
    firstDay: 1,
    maxDate: "+2m",
    minDate: 0,
    nextText: "Næste",
    prevText: "Tidligere",
    showOtherMonths: true,
    onSelect: function (date, dp) {
        updateDatePickerCells();
        updatePriceField(dp);
    },
    onChangeMonthYear: function(year, month, dp) {
        activeMonth = month;
        updateDatePickerCells();
        updateMonthControls()
    },
    beforeShow: function(elem, dp) {
        updateDatePickerCells();
    },
    beforeShowDay: function(date) {
        // Disable all day fields except those that are present in CellContents list.
        var currentDate = $.datepicker.formatDate('yy-mm-dd', date);

        if (activeDates.indexOf(currentDate) >= 0) {
            return [true,'date-active'];
        } else {
            return [false,''];
        }
    }
});

$("#calendar-input").val('');
$("#calendar-price").val('');

// Create price fields for days in calendar.

updateDatePickerCells();

function updateDatePickerCells(dp) {

    // Wait until current callstack is finished so the datepicker is fully rendered before attempting to modify contents

    setTimeout(function () {

        var cell = $('.ui-datepicker td.date-active');
        var cellLength = cell.length;

        for (var i = 0; i < cellLength; i++) {
            var current = $(cell[i]);

            // Retrieves current day, prepends 0 and removes -2nd character (returns 2-digit day)

            var currentDay = (0 + current.children().html()).slice(-2);

            // data-month is zero-indexed, so we increment by 1, change to string, prepend 0 and remove -2nd char

            var currentMonth = (0 + (parseInt(current.attr('data-month')) + 1).toString()).slice(-2);

            var currentDate = current.attr('data-year') + "-" + currentMonth + "-" + currentDay;
            var dayClass = "datepicker-" + currentDate;
            current.addClass(dayClass);
        }

        // Code below should be integrated after backend work is done, on ajax success.

        for (var cellDate in cellContents) {
            var cellPriceArray = [];

            for (var cellAirport in cellContents[cellDate]) {
                cellPriceArray.push(cellContents[cellDate][cellAirport].Price);
            }

            var cellPrice = Math.min.apply(null, cellPriceArray);

            $('.ui-datepicker td.datepicker-'+cellDate).attr('data-price', cellPrice);

            // Add a "." (to mark thousands in bigger prices) to cellPrice before adding it to calendar

            if (cellPrice.length > 3) {
                cellPrice = cellPrice.slice(0,-3) + "." + cellPrice.slice(-3);
            }

            var rule = '.ui-datepicker td.datepicker-' + cellDate + ' > *:after {content: "' + cellPrice + ',-";}';
            $('head').append('<style>' + rule + '</style>');
        }
    }, 0);
}

// Update price based on data-price fields.

function updatePriceField(dp) {
    var selectedDate = dp.selectedYear + "-" + (0 + (parseInt(dp.selectedMonth)+1).toString()).slice(-2) + "-" +dp.selectedDay;
    var activePrice = $('.ui-datepicker td.datepicker-'+selectedDate).attr('data-price');

    // Empty the airport list container

    $('#calendar-airports').html('');

    // Create a airport list items for each airport and append it to #calendar-airports

    for (var cellAirport in cellContents[selectedDate]) {
        var airportDetails = airportDetailsContainer(cellAirport, selectedDate, cellContents[selectedDate][cellAirport].Price, cellContents[selectedDate][cellAirport].Time);
        $('#calendar-airports').append(airportDetails);
    }

    // Add event to buttons in airport list items

    $("#calendar-airports").on('click', 'button', function() {
        var clickedDate = $(this).parent().attr('data-date');
        var clickedAirport = $(this).parent().attr('data-airport');
        calendarPopup(clickedDate, clickedAirport);
    })
}

// Populating calendar Popup and events for closing and opening it.

var popupContainer = $("#calendar-popup-container ");

popupContainer.click(function() {
    $(this).fadeOut();
});

$(".calendar-popup", popupContainer).click(function(e) {
    e.stopPropagation();
});

function calendarPopup(date, airport) {
    var calendarData = cellContents[date][airport];
    $(".airport-name", popupContainer).html(airport);
    $(".airport-time", popupContainer).html(calendarData['Time']);

    popupContainer.fadeIn();
}

// Function for building a single airport list item to append to the #caledanr-airports. Formatted inefficiently for easier manipulation :)

function airportDetailsContainer(name, date, price, time) {
    return '<div class="airport-container" data-airport="' + name +'" data-date="' + date + '">' +
                '<div class="airport-info">' +
                    '<p>Airport: <span class="airport-name">' + name + '</span><br />' +
                    'Price: <span class="airport-price">' + price + '</span><br />' +
                    'Time: <span class="airport-time">' + time + '</span></p>' +
                '</div>' +
                '<button>Buy</button>' +
            '</div>';
}

// External navigation header arrows

$('#next, #prev').on('click', function(e) {
    $('.ui-datepicker-'+e.target.id).trigger("click");
});

$('.month-control').each(function() {

    // Get month indexes and add specific class (for css changes), data-month (for changing function) and html content for navigations

    var index = parseInt($(this).attr('data-month-index')) + activeMonth;
    var yearMod = 0;

    if (index > 12) {
        index -= 12;
        yearMod = 1;
    }
    $(this).addClass('month-control-' + (index)).attr('data-month', index).html(monthsArray[index-1]);

    // Month navigation on click

    $(this).click(function() {
        if ($(this).attr('data-month') != activeMonth) {
            var targetDay = new Date().getDate();
            var targetMonth = index.toString();
            var targetYear = new Date().getFullYear() + yearMod;
            var targetDate = targetYear + "-" + targetMonth + "-" + targetDay;
            $('#calendar').datepicker('setDate',targetDate);
        }
    });
});

function updateMonthControls() {
    $('.month-control').removeClass("month-active")
    $('.month-control.month-control-' + activeMonth).addClass("month-active");
}

// TO BE DELETED

$('#raw-input').html(JSON.stringify(cellContents));
