const Alexa = require('ask-sdk-core');
const googleapi = require("./googleapi.js");
const regExpRange = /(^[A-Za-z]{1,2}\d{1,3})$/;

const welcome = "Que puis-je faire pour vous ? ";
const askForContinuation = "Souhaitez-vous continuer ?";
const defaultUnity = "kilogramme";
const unkownAction = "Désolé, mais je n'ai pas compris ce que je dois faire!";
const whatToDoNext = "Que dois-je faire ensuite?";
const itemNotFound = "Désolé, mais je n'ai pas réussi à trouver l'article!";
const notUnderstood = "Désolé, mais je n'ai pas compris!"
const goodbye = "A bientôt!";
const errorOccured = "Une erreur s'est produite! Merci de répéter s'il vous plait";
const help = "Vous pouvez dire par exemple, ajoute 10 kilos de farine de blé noir";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput){
        return handlerInput.responseBuilder
            .speak(welcome)
            .reprompt(askForContinuation)
            .getResponse();
    }
};

const ManageStockIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ManageStockIntent';
    },
    async handle(handlerInput) {
        var action = handlerInput.requestEnvelope.request.intent.slots.action.value;
        var item = handlerInput.requestEnvelope.request.intent.slots.item.value;
        var quantity = handlerInput.requestEnvelope.request.intent.slots.quantity.value;
        var speech = "";
        
        if(action && item){
            if(handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH'){
                if(handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].values.length > 1){
                     return handlerInput.responseBuilder
                        .speak(`De quel type de ${item} s'agit-il?`)
                        .reprompt(whatToDoNext)
                        .getResponse();
                }
                var range = handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].values[0].value.id;
                if(regExpRange.test(range)){
                    var stockRange = googleapi.getNextCell(range);
                    var stockCell = `Feuille 1!${stockRange}`;
                    var alertRange = googleapi.getNextCell(stockRange);
                    var alertCell = `Feuille 1!${alertRange}`;
                    var unityRange = googleapi.getNextCell(alertRange);
                    var unityCell = `Feuille 1!${unityRange}`;
                    
                    var stockValue = await googleapi.getNumberValue(stockCell);
                    var alertValue = await googleapi.getNumberValue(alertCell);
                    var unityValue = await googleapi.getStringValue(unityCell);
                    
                    if(quantity === null || quantity ===''){
                        quantity = 1;
                    }
                    if(handlerInput.requestEnvelope.request.intent.slots.action.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH'){
                        var actionId = handlerInput.requestEnvelope.request.intent.slots.action.resolutions.resolutionsPerAuthority[0].values[0].value.id;
                        if(actionId === "ADD"){
                            stockValue = stockValue + Number(quantity);
                            speech = `C'est noté, j'ai ajouté ${quantity} ${unityValue} de ${item} dans le stock.`;
                        }
                        else if(actionId === "RMV"){
                            if(stockValue < Number(quantity)){
                                speech = `Attention, vous n'avez pas assez de ${item} pour en sortir ${quantity} ${unityValue}! `;
                            }else{
                                stockValue = stockValue - Number(quantity);
                                speech = `C'est noté, j'ai sorti ${quantity} ${unityValue} de ${item} dans le stock.`;
                                if(stockValue <= alertValue){
                                    if(stockValue === 0){
                                        speech = speech + ` Attention, votre stock de ${item} est épuisé!`;
                                    }else{
                                        speech = speech + ` Attention, vous arrivez bientôt à court de ${item}!`;
                                    }
                                }
                            }
                        }
                        
                        await googleapi.updateSheet(stockCell, stockValue);
                    }else{
                        return handlerInput.responseBuilder
                        .speak(unkownAction)
                        .reprompt(askForContinuation)
                        .getResponse();
                    }
                    
                    return handlerInput.responseBuilder
                        .speak(speech)
                        .reprompt(whatToDoNext)
                        .getResponse();
                } else{
                    return handlerInput.responseBuilder
                    .speak(itemNotFound)
                    .reprompt(whatToDoNext)
                    .getResponse();
                }
            }
            else{
                return handlerInput.responseBuilder
                    .speak(itemNotFound)
                    .reprompt(whatToDoNext)
                    .getResponse();
            }
        }
        
        //on s'est trompé d'intent
        return handlerInput.responseBuilder
                .speak(notUnderstood)
                .reprompt(whatToDoNext)
                .getResponse();
    }
}

const ReadStockIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReadStockIntent';
    },
    async handle(handlerInput) {
        var item = handlerInput.requestEnvelope.request.intent.slots.item.value;
        if(item && handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH'){
            if(handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].values.length > 1){
                     return handlerInput.responseBuilder
                        .speak(`De quel type de ${item} s'agit-il?`)
                        .reprompt(whatToDoNext)
                        .getResponse();
            }
            var range = handlerInput.requestEnvelope.request.intent.slots.item.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            if(regExpRange.test(range)){
                var stockRange = googleapi.getNextCell(range);
                var stockCell = `Feuille 1!${stockRange}`;
                var alertRange = googleapi.getNextCell(stockRange);
                var unityRange = googleapi.getNextCell(alertRange);
                var unityCell = `Feuille 1!${unityRange}`;
                var stockValue = await googleapi.getNumberValue(stockCell);
                var unityValue = await googleapi.getStringValue(unityCell);
                
                var speech = `Il vous reste ${stockValue} ${unityValue} de ${item}`;
                if(stockValue === 0)
                    speech = `Votre stock de ${item} est épuisé!`;
                
                return handlerInput.responseBuilder
                    .speak(speech)
                    .reprompt(whatToDoNext)
                    .getResponse();
            }
        }
        
        return handlerInput.responseBuilder
            .speak(itemNotFound)
            .reprompt(whatToDoNext)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(help)
            .reprompt(askForContinuation)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(goodbye)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(notUnderstood)
            .reprompt(askForContinuation)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.speak(goodbye).getResponse(); // notice we send an empty response
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(errorOccured)
            .reprompt(askForContinuation)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ManageStockIntentHandler,
        ReadStockIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('francis/v1.0')
    .lambda();