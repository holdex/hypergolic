import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { getNumberFromTag, isValidUrl } from './rockets';

export class MeritRequest {
	ID: string;
	Sats: number;
	Merits: number;
	Request: NDKEvent;
	Pubkey: string;
	TimeStamp: number;
	RocketTag: string | undefined; //31108:<pubkey>:<dtag>
	Problem(): string {
		let _problem = '';
		//todo: handle 1971 problem tracker event tags somehow
		for (let problem of this.Request.getMatchingTags('problem')) {
			if (problem && problem.length > 2) {
				_problem = problem[2];
			}
		}
		return _problem;
	}
    Solution(): URL|undefined {
		let _solution:URL|undefined = undefined;
		for (let solution of this.Request.getMatchingTags('solution')) {
			if (solution && solution.length > 2 && solution[1] == "url") {
				if (isValidUrl(solution[2])) {
                    _solution = new URL(solution[2])
                }
			}
		}
		return _solution;
	}
	IncludedInRocketState(rocket: NDKEvent): boolean {
		return true;
	}
	BasicValidation(): boolean {
		//todo: make a ValidateAgainstRocket and check that pubkey is in WoT
		let valid = true;
		if (!(this.ID.length == 64 && this.Merits > 0 && this.Pubkey.length == 64 && this.TimeStamp && this.RocketTag)) {
            valid = false
        }
		return valid;
	}
    REQFilter(kind?:number):NDKFilter {
        if (!this.BasicValidation()) {
            return {}
        }
        if (!kind) {
            kind = 31108
        }
        return { '#d': [this.RocketTag?.split(":")[2]!], authors: [this.RocketTag?.split(":")[1]!], kinds: [kind as number] }
    }
	constructor(request: NDKEvent) {
		this.Request = request;
		this.ID = request.id;
		this.Pubkey = request.pubkey;
		if (this.Request.created_at) {
			this.TimeStamp = this.Request.created_at;
		}
		for (let tag of this.Request.getMatchingTags('a')) {
			if (tag && tag.length > 1) {
				if (tag[1].split(':') && tag[1].split(':').length == 3) {
					if ((tag[1].split(':')[0] = '31108')) {
						this.RocketTag = tag[1];
					}
				}
			}
		}

		this.Sats = getNumberFromTag('sats', request);
		this.Merits = getNumberFromTag('merits', request);
	}
}