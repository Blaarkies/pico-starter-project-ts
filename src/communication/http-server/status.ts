import { coerce } from '../../common/transform';

export function statusIs200s(response: Response): boolean {
    return coerce(response.status, 200, 299) === response.status;
}