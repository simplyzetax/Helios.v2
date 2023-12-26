class DateUtil {
    public static dateAddTime(pdate: Date, number: number) {
        const date = pdate;
        date.setHours(date.getHours() + number);
        return date;
    }
}

export default DateUtil;