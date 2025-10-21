function TypingAccuracyViewModel() {
    var self = this;
    
    // Observable properties
    self.sampleText = ko.observable("The quick brown fox jumps over the lazy dog. Practice makes perfect when it comes to typing accuracy.");
    self.userInput = ko.observable("");
    self.isActive = ko.observable(false);
    self.isComplete = ko.observable(false);
    
    // Tracking metrics
    self.startTime = null;
    self.endTime = null;
    self.backspaceCount = ko.observable(0);
    self.deleteCount = ko.observable(0);
    self.ctrlShiftArrowCount = ko.observable(0);
    self.totalKeystrokes = ko.observable(0);
    
    // Computed properties
    self.charactersTyped = ko.computed(function() {
        return self.userInput().length;
    }, self);
    
    self.correctCharacters = ko.computed(function() {
        var sample = self.sampleText();
        var typed = self.userInput();
        var correct = 0;
        
        for (var i = 0; i < typed.length; i++) {
            if (i < sample.length && typed[i] === sample[i]) {
                correct++;
            }
        }
        
        return correct;
    }, self);
    
    self.incorrectCharacters = ko.computed(function() {
        return self.charactersTyped() - self.correctCharacters();
    }, self);
    
    self.accuracy = ko.computed(function() {
        if (self.charactersTyped() === 0) return 0;
        return Math.round((self.correctCharacters() / self.charactersTyped()) * 100);
    }, self);
    
    self.elapsedSeconds = ko.computed(function() {
        if (!self.startTime) return 0;
        var end = self.endTime || new Date();
        return (end - self.startTime) / 1000;
    }, self);
    
    self.wordsPerMinute = ko.computed(function() {
        var seconds = self.elapsedSeconds();
        if (seconds === 0) return 0;
        // Standard: 5 characters = 1 word
        var words = self.correctCharacters() / 5;
        var minutes = seconds / 60;
        return Math.round(words / minutes);
    }, self);
    
    self.editingActions = ko.computed(function() {
        return self.backspaceCount() + self.deleteCount() + self.ctrlShiftArrowCount();
    }, self);
    
    self.rawAccuracy = ko.computed(function() {
        if (self.totalKeystrokes() === 0) return 100;
        var errors = self.editingActions() + self.incorrectCharacters();
        var accuracy = ((self.totalKeystrokes() - errors) / self.totalKeystrokes()) * 100;
        return Math.max(0, Math.round(accuracy));
    }, self);
    
    self.shouldDisplayResults = ko.computed(function() {
        return self.isComplete() || (self.isActive() && self.charactersTyped() > 0);
    }, self);
    
    // Methods
    self.startTyping = function() {
        self.isActive(true);
        self.isComplete(false);
        self.userInput("");
        self.backspaceCount(0);
        self.deleteCount(0);
        self.ctrlShiftArrowCount(0);
        self.totalKeystrokes(0);
        self.startTime = new Date();
        self.endTime = null;
    };
    
    self.resetTest = function() {
        self.isActive(false);
        self.isComplete(false);
        self.userInput("");
        self.backspaceCount(0);
        self.deleteCount(0);
        self.ctrlShiftArrowCount(0);
        self.totalKeystrokes(0);
        self.startTime = null;
        self.endTime = null;
    };
    
    self.handleKeydown = function(vm, event) {
        if (!self.isActive()) {
            self.startTyping();
        }
        
        // Track special keys
        if (event.key === 'Backspace') {
            self.backspaceCount(self.backspaceCount() + 1);
        } else if (event.key === 'Delete') {
            self.deleteCount(self.deleteCount() + 1);
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && 
                   (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            self.ctrlShiftArrowCount(self.ctrlShiftArrowCount() + 1);
        } else if (event.key.length === 1) {
            // Only count printable characters
            self.totalKeystrokes(self.totalKeystrokes() + 1);
        }
        
        // Check if test is complete
        if (self.userInput().length >= self.sampleText().length) {
            self.completeTest();
        }
        
        return true; // Allow default behavior
    };
    
    self.completeTest = function() {
        if (!self.isComplete()) {
            self.isComplete(true);
            self.isActive(false);
            self.endTime = new Date();
        }
    };
    
    // Formatted display values
    self.accuracyDisplay = ko.computed(function() {
        return self.accuracy() + "%";
    }, self);
    
    self.wpmDisplay = ko.computed(function() {
        return self.wordsPerMinute() + " WPM";
    }, self);
    
    self.backspaceDisplay = ko.computed(function() {
        return self.backspaceCount().toLocaleString();
    }, self);
    
    self.deleteDisplay = ko.computed(function() {
        return self.deleteCount().toLocaleString();
    }, self);
    
    self.ctrlShiftArrowDisplay = ko.computed(function() {
        return self.ctrlShiftArrowCount().toLocaleString();
    }, self);
    
    self.editingActionsDisplay = ko.computed(function() {
        return self.editingActions().toLocaleString();
    }, self);
    
    self.rawAccuracyDisplay = ko.computed(function() {
        return self.rawAccuracy() + "%";
    }, self);
}
