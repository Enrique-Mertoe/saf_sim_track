import ExportToExelComponent from "./ExportToExelComponent";
import {showModal} from "@/ui/shortcuts";
import alert from "@/ui/alert";

export default function ExportToExel({user, selectedPeriod, startDate, endDate}) {
    function onProcess() {

    }

    if (!user) {
        return alert.error("User not found");
    }

    showModal({
        content: onClose => <ExportToExelComponent onClose={onClose} onProcess={onProcess} user={user}  selectedPeriod={selectedPeriod}
                                                   startDate={startDate} endDate={endDate}/>,
    })
}