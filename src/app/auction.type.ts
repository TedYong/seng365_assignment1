type auctionType = {
    id?: number,
    title: string,
    description: string,
    endDate:string,
    imageFilename?:string|null,
    reserve:number,
    sellerId:number,
    categoryId:number
}