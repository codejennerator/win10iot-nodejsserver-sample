var uwp = require("uwp");
uwp.projectNamespace("Windows.Devices");

var express = require('express');
var app = express();


//stores the pin object so that it can be manipulated until it is closed at which point, that pin object is removed from the array
var openPinLookup = {};
//port to listen on
var port = process.env.PORT || 1337;

app.get('/', function (req, res) {
    
    res.json({ message: 'Welcome, try using: /updatePin /addPin or /deletePin. Be sure to pass a pin_num parameter.' });
});

//gets the pin number from the request, finds out its current value and changes it from on to off or from off to on
app.get('/readPin', function (req, res) {
    
    if (req.param('pin_num')) {
        
        var pinNum = req.param('pin_num');
        
        //check for pin object associated with this pinNum in the array
        if (openPinLookup[pinNum]) {
            
            var pin = openPinLookup[pinNum];
            var currentValue = pin.read();
            
            res.json({ message: currentValue });
        }
    
        else {
            res.json({ error: 'Pin Num ' + pinNum + '  not found for reading' });
        }
    }
        
        
    else {
        res.json({ error: 'req.pin_num not found' });
    }
    
});

//gets the pin number from the request, finds out its current value and changes it from on to off or from off to on
app.put('/updatePin', function (req, res) {
        
    if (req.param('pin_num')) {
        
        var pinNum = req.param('pin_num');
        
        //check for pin object associated with this pinNum in the array
        if (openPinLookup[pinNum]) {
            
            var pin = openPinLookup[pinNum];
            var currentValue = pin.read();
            //get current value and then set the value to the opposite value
            if (currentValue == Windows.Devices.Gpio.GpioPinValue.high) {
                
                currentValue = Windows.Devices.Gpio.GpioPinValue.low;

            } else {
                
                currentValue = Windows.Devices.Gpio.GpioPinValue.high;

            }
            //write value to the pin
            pin.write(currentValue);
            res.json({ message: pinNum + ' updated' });
        }
    
        else {
            res.json({ error: 'Pin Num ' + pinNum + '  not found for updating' });
        }
    }
        
        
    else {
        res.json({ error: 'req.pin_num not found' });
    }
    
});

//opens a pin based on the pin_num from the request and sets it to the on state and adds it to the array of pin objects
app.post('/addPin', function (req, res) {
    
    if (req.param('pin_num')) {
        
        var gpioController = Windows.Devices.Gpio.GpioController.getDefault();
        
        if (gpioController == null) {
            res.json({ error: 'There is not a GPIO Controller on this device' });
        }
        else {
            
            var pinNum = req.param('pin_num');
            var result = gpioController.tryOpenPin(pinNum, Windows.Devices.Gpio.GpioSharingMode.exclusive);
            //a successfull opening of a pin returns a 0 otherwise a 1 or 2 is returned
            if (result.openStatus == 0) {
                
                var pin = result.pin;
                pin.setDriveMode(Windows.Devices.Gpio.GpioPinDriveMode.output);
                
                var currentValue = Windows.Devices.Gpio.GpioPinValue.high;
                pin.write(currentValue);
                
                //adding pin object to array
                openPinLookup[pinNum] = pin;
                
                res.json({ message: 'added ' + pinNum });
            }
            else {
                res.json({ error: pinNum + ' already open, does not exist or is unavailable for opening' });
            }
        }
    }
    
    else {
        res.json({ error: 'req.pin_num not found' });
    }

});

//closes a pin based on the pin_num from the request and removes it from the array
app.delete('/deletePin', function (req, res) {
    
    if (req.param('pin_num')) {
        
        var pinNum = req.param('pin_num');
        //get the pin object associated with this pinNum from the array
        var currentPin = openPinLookup[req.param('pin_num')];
        //if we have an object associated with this pin number get it and close the pin
        if (currentPin) {
            currentPin.close();
            
            //this pin is now closed so remove it from the array
            delete openPinLookup[pinNum];
            
            res.json({ message: 'removed ' + pinNum });
        } 
        else {
            res.json({ error: pinNum + 'not found in array' });
        }
    }
    else {
        res.json({ error: 'req.pin_num not found' });
    }
});

// START THE SERVER

// =============================================================================

app.listen(port, function () {
    console.log('listening on port ' + port);
});