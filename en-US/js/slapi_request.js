// Copyright (c) 2010, SoftLayer Technologies, Inc. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//  * Neither SoftLayer Technologies, Inc. nor the names of its contributors may
//    be used to endorse or promote products derived from this software without
//    specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

var softlayer = { API_BASE_URL : "https://api.service.softlayer.com/rest/v3" };

// A utility routine that appends a path component (using unix-style 
// directory separators) to an existing path. It tries to ensure that
// the two components are joined with one, and only one, directory separator
// between them.
String.prototype.stringByAppendingPathComponent = function(newComponent)
{
    return this.replace(/\/+$/,'') + '/' + newComponent.replace(/^\/+/,'')
} 

//	SLAPI Request.
//	
//   userName is SL account user
//	 apiKey API key for the user.
//   serviceName is the name of the service to invoke.  e.g. "SoftLayer_Account"
//   serviceMethod is the method of the service you would like to invoke.  e.g. "getOpenTickets"
//   objectID is a particular object ID passed to the request.  e.g. the id of the ticket you would 
//   like details about.
//
//	After you've constructed one you should set the following properties:
//	successCallback - a function with the signature function(request) which will be invoked when the 
//                       request succeeds.  If the request succeeds and returns an JSON object, that
//                       object can be found as the "responseObject" property of the request.
//
//	failureCallback - a function with the signature function(request, exception) which will be invoked 
//                      if the request fails. The exception parameter should give you some idea of why
//                      the request failed. If the server reports an API error as a JSON object, the
//                      exception will be SLAPIRequest.apiCallResponseError and the "responseObject"
//                      property of the request will be the JSON "error" object returned.
//
//	You can also change:
//	httpMethod - the method (GET, POST, etc.) for the HTTP request
//	httpBody - information to be passed as the body of the request
//    objectMask - An array of strings to be sent as the objectMask for the request.
function SLAPIRequest(userName, apiKey, serviceName, serviceMethod, objectID )
{
	if(null == userName)
		throw new Error("APIRequests require an account user")
	
	if(null == apiKey)
		throw new Error("APIRequests require an account user")
		
	if(null == serviceName || '' == serviceName )
		throw new Error("API requests require a service name")

	if(null == serviceMethod)
		throw new Error("API Request require a service method")

    this.serviceName = escape(serviceName);
    this.serviceMethod = escape(serviceMethod);
    this.objectID = objectID;

	this.userName = userName
	this.apiKey = apiKey

	this.httpMethod = "GET"
	this.httpBody = null
	this.successCallback = function(request) {}
	this.failureCallback = function(request, exception) {}

    return this;
}

// Execute a SLAPI request
// On fail your failure callback is invoked.
SLAPIRequest.prototype.execute = function ()
{
	var httpRequest = new XMLHttpRequest();
	try {
		var self = this;

		httpRequest.open(this.httpMethod,
							this.apiCallURL(),
							true,
							this.userName,
							this.apiKey);
		httpRequest.onreadystatechange = function() { self.readyStateChanged(httpRequest) }
		httpRequest.setRequestHeader("Cache-Control", "no-cache, must-revalidate");
		httpRequest.setRequestHeader("Pragma", "no-cache");
		//This one seems to be the key for getting IE8 to refresh
		httpRequest.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
		httpRequest.send(this.httpBody)
	}

	catch(exception)
	{    
        if(this.failureCallback instanceof Function)
        {
            this.failureCallback(httpRequest, exception)
        }
	}
}

// Build a URL from this objects supplied parameters
SLAPIRequest.prototype.apiCallURL = function ()
{	
	var apiPath = this.serviceName.stringByAppendingPathComponent(this.serviceMethod)
	if(null != this.objectID)
	{
		apiPath = apiPath.stringByAppendingPathComponent(objectID.toString())
	}

    if(this.objectMask)
    {
        apiPath = apiPath + "?objectMask=" + this.objectMask;
    }

	var apiCallURL = softlayer.API_BASE_URL.stringByAppendingPathComponent(apiPath)
	return apiCallURL;
}

// Treat response as JSON and invoke appropriate callback 
SLAPIRequest.prototype.handleJSONResponse = function (httpRequest, jsonObject)
{
    httpRequest.responseObject = jsonObject;

    if(jsonObject["error"] === undefined)
    {
        // A json object was successfully retrieved!
        if(this.successCallback instanceof Function)
        {
            this.successCallback(httpRequest, jsonObject)
        }
    } else {
        // Looks like the API reported a failure.
        if(this.failureCallback instanceof Function)
        {
            this.failureCallback(httpRequest, jsonObject, SLAPIRequest.apiCallResponseError)
        }
    }
}

// Handle a response for a pending request.
SLAPIRequest.prototype.handleSuccessfulRequest = function (httpRequest) 
{
    var responseType = httpRequest.getResponseHeader("Content-Type");
    if("application/json" == responseType)
    {
        try
        {
			var responseObject = eval('(' + httpRequest.responseText + ')');
            if(responseObject)
            {
                this.handleJSONResponse(httpRequest, responseObject)
            }
        }

        catch(e)
        {
            if(this.failureCallback instanceof Function)
            {
                this.failureCallback(httpRequest, null, e)
            }
        }
    } else {
        // Response didn't report itself as JSON so just try to call
        // the generic success callback.
        if(this.successCallback instanceof Function)
        {
            this.successCallback(httpRequest, null)
        }
    }            
}

// Monitor state changes on pending HTTP request.
SLAPIRequest.prototype.readyStateChanged = function (httpRequest) 
{
	if( 0x04 == httpRequest.readyState)
    {
        if(httpRequest.status >= 200 && httpRequest.status <= 299)
        {
            this.handleSuccessfulRequest(httpRequest);
        } else {
            // Response wasn't in the 200's so this must be come kind of networking
            // or server error.
            if(this.failureCallback instanceof Function)
            {
                this.failureCallback(httpRequest, SLAPIRequest.httpResponseError)
            }
        }
    }
}

// Canned error responses.
SLAPIRequest.httpResponseError = new Error("The server reported an internal error")
SLAPIRequest.apiCallResponseError = new Error("The api call reported an internal error")
