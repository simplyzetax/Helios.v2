import { v4 as uuidv4 } from 'uuid';

class UUID {

    public static g() {
        return uuidv4().replace(/-/g, "");
    }

}

export default UUID;