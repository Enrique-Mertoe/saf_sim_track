// First, import the _alert_prompt function in your alert.tsx file
import {_addAlert, _alert_confirm, _alert_prompt, AlertContextType, ConfirmType} from "./AlertDialog";

const alert: AlertContextType = {
    success: (message, options) => _addAlert('success', message, options),
    error: (message, options) => _addAlert('error', message, options),
    info: (message, options) => _addAlert('info', message, options),
    warning: (message, options) => _addAlert('warning', message, options),
    confirm: _alert_confirm,
    prompt: _alert_prompt,  // Add this line to implement prompt functionality
    ERROR: ConfirmType.ERROR,
    WARN: ConfirmType.WARN,
    INFO: ConfirmType.INFO,
    SUCCESS: ConfirmType.SUCCESS,
}

export default alert;
