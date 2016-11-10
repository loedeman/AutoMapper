module AutoMapperJs {
    'use strict';
    export enum DestinationTransformationType {
        Constant = 1,
        MemberOptions = 2,
        AsyncMemberOptions = 4,
        SourceMemberOptions = 8,
        AsyncSourceMemberOptions = 16
    }
}