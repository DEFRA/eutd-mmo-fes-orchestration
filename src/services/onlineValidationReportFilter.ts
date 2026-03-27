import { IOnlineValidationReportItem } from "../persistence/schema/onlineValidationReport"

export default class ValidationFilterService {

    public filterOnlineValidationReport(is3CBlockOn: boolean, is3DBlockOn: boolean, is4ABlockOn: boolean, isBlockingNoDataSubmittedOn: boolean, isBlockingNoLicenceHolderOn: boolean, onlineReport: IOnlineValidationReportItem[]) {
        const validationRulesStatus = [[is3CBlockOn, "3C"], [is3DBlockOn, "3D"], [is4ABlockOn, "4A"], [isBlockingNoDataSubmittedOn, "noDataSubmitted"], [isBlockingNoLicenceHolderOn, "noLicenceHolder"]];
        const enabledValidationRules = validationRulesStatus.filter(_ => _[0]).map(_ => _[1]);

        return onlineReport.map(report=> {
            const isBlockedRuleInFailure = report.failures.some(_ => enabledValidationRules.includes(_));
            if (isBlockedRuleInFailure) {
                report.failures = report.failures.filter(_ => enabledValidationRules.includes(_));
                return report;
            }
        }).filter(_ => _)
    }
}
