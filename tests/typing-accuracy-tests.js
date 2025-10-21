// A fake knockout object, added to the global object.
// This one will be used by the TypingAccuracyViewModel when executed from the unit tests.
var ko = {
    observable: function (val) {
        var _value = val;
        var observable = function () {
            if (arguments.length > 0) {
                _value = arguments[0];
            }
            return _value;
        };
        return observable;
    },
    computed: function (callback, context) {
        return function () {
            return callback.call(context);
        };
    }
};

// wrap all unit testing code in a self executing anonymous function,
// to avoid adding things to the global object and naming collisions.

(function () {

    var viewModel;

    module('typing-accuracy-tests', {
        setup: function () {
            viewModel = new TypingAccuracyViewModel();
        },
        teardown: function () {
            viewModel = null;
        }
    });

    test('view model has default values', function () {
        ok(viewModel.sampleText, 'expecting: viewModel.sampleText');
        ok(viewModel.userInput, 'expecting: viewModel.userInput');
        ok(viewModel.isActive, 'expecting: viewModel.isActive');
        ok(viewModel.isComplete, 'expecting: viewModel.isComplete');
        ok(viewModel.backspaceCount, 'expecting: viewModel.backspaceCount');
        ok(viewModel.deleteCount, 'expecting: viewModel.deleteCount');
        ok(viewModel.ctrlShiftArrowCount, 'expecting: viewModel.ctrlShiftArrowCount');
        ok(viewModel.totalKeystrokes, 'expecting: viewModel.totalKeystrokes');
    });

    test('initial state is inactive', function () {
        equal(viewModel.isActive(), false, 'should not be active initially');
        equal(viewModel.isComplete(), false, 'should not be complete initially');
        equal(viewModel.userInput(), '', 'should have empty input initially');
    });

    test('character accuracy with correct input', function () {
        viewModel.userInput('The quick');
        
        equal(viewModel.charactersTyped(), 9, 'should count 9 characters');
        equal(viewModel.correctCharacters(), 9, 'all 9 characters should be correct');
        equal(viewModel.incorrectCharacters(), 0, 'should have no incorrect characters');
        equal(viewModel.accuracy(), 100, 'should have 100% accuracy');
    });

    test('character accuracy with incorrect input', function () {
        viewModel.userInput('Txe quick');
        
        equal(viewModel.charactersTyped(), 9, 'should count 9 characters');
        equal(viewModel.correctCharacters(), 8, 'should have 8 correct characters');
        equal(viewModel.incorrectCharacters(), 1, 'should have 1 incorrect character');
        equal(viewModel.accuracy(), 89, 'should have 89% accuracy (8/9 = 88.88% rounded to 89)');
    });

    test('WPM calculation with correct characters', function () {
        viewModel.startTime = new Date(Date.now() - 60000); // 1 minute ago
        viewModel.userInput('The quick brown fox jumps'); // 25 characters = 5 words
        
        // At 1 minute, 5 words should give us 5 WPM
        var wpm = viewModel.wordsPerMinute();
        equal(wpm, 5, 'should calculate 5 WPM for 25 characters in 1 minute');
    });

    test('editing actions count', function () {
        viewModel.backspaceCount(3);
        viewModel.deleteCount(2);
        viewModel.ctrlShiftArrowCount(1);
        
        equal(viewModel.editingActions(), 6, 'should sum all editing actions');
    });

    test('raw accuracy with editing actions', function () {
        viewModel.totalKeystrokes(100);
        viewModel.backspaceCount(5);
        viewModel.deleteCount(3);
        viewModel.ctrlShiftArrowCount(2);
        viewModel.userInput('The quick');
        
        // Total errors = 5 + 3 + 2 + 0 incorrect chars = 10
        // Raw accuracy = (100 - 10) / 100 * 100 = 90%
        equal(viewModel.rawAccuracy(), 90, 'should calculate raw accuracy including editing actions');
    });

    test('startTyping resets state', function () {
        viewModel.userInput('some text');
        viewModel.backspaceCount(5);
        viewModel.deleteCount(3);
        viewModel.isComplete(true);
        
        viewModel.startTyping();
        
        equal(viewModel.isActive(), true, 'should be active after starting');
        equal(viewModel.isComplete(), false, 'should not be complete after starting');
        equal(viewModel.userInput(), '', 'should reset user input');
        equal(viewModel.backspaceCount(), 0, 'should reset backspace count');
        equal(viewModel.deleteCount(), 0, 'should reset delete count');
        equal(viewModel.ctrlShiftArrowCount(), 0, 'should reset ctrl+shift+arrow count');
        ok(viewModel.startTime, 'should set start time');
    });

    test('resetTest clears all state', function () {
        viewModel.startTyping();
        viewModel.userInput('test');
        viewModel.backspaceCount(2);
        
        viewModel.resetTest();
        
        equal(viewModel.isActive(), false, 'should not be active after reset');
        equal(viewModel.isComplete(), false, 'should not be complete after reset');
        equal(viewModel.userInput(), '', 'should clear user input');
        equal(viewModel.backspaceCount(), 0, 'should clear backspace count');
        equal(viewModel.startTime, null, 'should clear start time');
    });

    test('shouldDisplayResults is false when no typing', function () {
        equal(viewModel.shouldDisplayResults(), false, 'should not display results initially');
    });

    test('shouldDisplayResults is true when typing', function () {
        viewModel.isActive(true);
        viewModel.userInput('T');
        
        equal(viewModel.shouldDisplayResults(), true, 'should display results when typing');
    });

    test('shouldDisplayResults is true when complete', function () {
        viewModel.isComplete(true);
        
        equal(viewModel.shouldDisplayResults(), true, 'should display results when complete');
    });

    test('handleKeydown tracks backspace', function () {
        var event = { key: 'Backspace' };
        
        viewModel.handleKeydown(viewModel, event);
        
        equal(viewModel.backspaceCount(), 1, 'should increment backspace count');
    });

    test('handleKeydown tracks delete', function () {
        var event = { key: 'Delete' };
        
        viewModel.handleKeydown(viewModel, event);
        
        equal(viewModel.deleteCount(), 1, 'should increment delete count');
    });

    test('handleKeydown tracks ctrl+shift+arrow', function () {
        var event = { key: 'ArrowLeft', ctrlKey: true, shiftKey: true };
        
        viewModel.handleKeydown(viewModel, event);
        
        equal(viewModel.ctrlShiftArrowCount(), 1, 'should increment ctrl+shift+arrow count');
    });

    test('handleKeydown tracks printable characters', function () {
        var event = { key: 'a' };
        
        viewModel.handleKeydown(viewModel, event);
        
        equal(viewModel.totalKeystrokes(), 1, 'should increment total keystrokes');
    });

    test('handleKeydown starts typing on first key', function () {
        var event = { key: 'T' };
        
        equal(viewModel.isActive(), false, 'should not be active initially');
        
        viewModel.handleKeydown(viewModel, event);
        
        equal(viewModel.isActive(), true, 'should be active after first key');
    });

}());
